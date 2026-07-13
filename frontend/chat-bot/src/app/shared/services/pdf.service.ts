import { Injectable } from '@angular/core';
import { DatePipe } from '@angular/common';
import pdfMake from 'pdfmake/build/pdfmake';
import { THSarabun64 } from '../../../assets/pdf/font-base64'
import {HospitalService} from './../services/hospital.service';
// import { I } from '@angular/cdk/keycodes';
@Injectable({
  providedIn: 'root'
})
export class PdfService {

  public imageData: any = '/assets/Alert/common_icons/new-logo.png';
  public nowFacility: string;


  getBase64ImageFromURL(url) {
    return new Promise((resolve, reject) => {
      let img = new Image();
      img.setAttribute('crossOrigin', 'anonymous');
      img.onload = () => {
        let canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        let ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        let dataURL = canvas.toDataURL('image/png', 1);
        resolve(dataURL);
      };
      img.onerror = error => {
        reject(error);
      };
      img.src = url;
    });
  }

  getBase64ImageFromImage(chartData) {
    let canvas = chartData
    let dataURL = canvas.toDataURL('image/png', 1);
    return dataURL;
  }

  constructor(public datepipe: DatePipe,private readonly hospitalService: HospitalService) { 
(pdfMake as any).vfs = {
  'THSarabunNewBold': THSarabun64.THSarabunbold,
  'THSarabunNewBoldItalic': THSarabun64.bolditalic,
  'THSarabunNewItalic': THSarabun64.italic
};

(pdfMake as any).fonts = {
  THSarabunNew: {
    normal: 'THSarabunNewBold',
    bold: 'THSarabunNewBold',
    italics: 'THSarabunNewItalic',
    bolditalics: 'THSarabunNewBoldItalic'
  }
};
    let customerValue = localStorage.getItem('customerId');
    let regionValue = localStorage.getItem('regionId');
    let facilityValue = localStorage.getItem(btoa('facilityId'));
    this.hospitalService.getCustomerList().subscribe(cust => {
      let customerList = cust.results;
      this.hospitalService.getRegionList(customerValue).subscribe(reg => {
        let regionList = reg.results;
        this.hospitalService.getFacilityList(regionValue).subscribe(fac => {
          let facilityList = fac.results;
          const customer = customerList.filter(res => res.id === customerValue);
          const region = regionList.filter(res => res.id === regionValue);
          const facility = facilityList.filter(res => res.id === facilityValue);
          this.nowFacility = (customer.length ? customer[0].name + ', ' : '') + (region.length ? region[0].name + ', ' : '') + (facility.length ? facility[0].name : '');
        });
      });
    });
  }
  private buildTableBody(data, columns) {
    let body = [];

    body.push(columns);
    data.forEach(function(row) {
        let dataRow = [];
        columns.forEach(function(column) {
          if (row[column] != null || row[column] != undefined) {
            dataRow.push(row[column].toString());
          } else {
            dataRow.push(null);
          }
        });
        body.push(dataRow);
    });

    return body;
  }

  private table(data, columns) {
    let widthList = [];
    for (let index = 0; index < columns.length; index++) {
      if ( columns[data] != null && (columns[index] === 'Package Name' || columns[index] === 'Health Plan')) {
        widthList[index] = '*';
      } else {
        widthList[index] = 'auto';
      }
    }
    return {
      style : 'tableExample',
      table: {
        headerRows: 1,
        widths : widthList,
        body: this.buildTableBody(data, columns)
      },
      styles : {
        tableExample: {
        }
      }
    };
  }

  async setDocumentDefinition(json: any[], columns: any[], name: string, selectedDate: string, id: string, chartData: any, addInfo?: any) {
    if ( columns.length > 0 && columns[0].text != null) {
      columns = columns.map(value => value.text);
    }
    let chartImage = chartData;
    let pageSize = null
    if (columns.length >= 22) {
      pageSize = {
        width : 2250,
        height : 800,
      };
    } else if (columns.length >= 16 && columns.length < 22) {
      pageSize = {
        width : 1750,
        height : 800,
      }
    } else if (columns.length > 12 && columns.length < 16) {
      pageSize = {
        width : 1350,
        height : 800,
      }
    } else if (columns.length ===  11 && name === 'error_log') {
      pageSize = {
        width : 2000,
        height : 800,
      }
    } else {
      pageSize = {
        width : 1200,
        height : 800,
      }
    }
    
    let chartColumn1: Array<any> = [];
    let chartColumn2: Array<any> = [];
    let chartColumn3: Array<any> = [];
    let chartColumn4: Array<any> = [];
    let chartColumn5: Array<any> = [];
    let speciality : Array<String> = [];
    if (chartData.length == 1) {
      if (id == 'package_summary') {
        chartColumn1.push({image : this.getBase64ImageFromImage(chartImage[0]), fit : [1020, 550], alignment: 'center',
        margin : [10, 15, 10, 50]});
      }else if (id == 'env-moni-rep' || id == 'vitals-infant' || id == 'vitals-chart') {
        chartColumn1.push({image : this.getBase64ImageFromImage(chartImage[0]), fit : [1020, 550], alignment: 'center',
        margin : [0, 0, 0, 0]});
      } else if(id == 'pat-routin-sumary' || id == 'stf-routin-sumary'){
        chartColumn1.push({image : this.getBase64ImageFromImage(chartImage[0]), fit : [650, 550], alignment: 'center',
        margin : [0, 0, 0, 0]});
      } else {
        chartColumn1.push({image : this.getBase64ImageFromImage(chartImage[0]), fit : [1020, 550], alignment : 'center', margin : [10, 15, 10, 50]});
      }
    } else if (chartData.length == 2) {
      if(id=="nurse-call" || id =='maintenancerep' || id == 'asset-misplaced' || id == 'asset-missing' || id == 'asset-utilz')
      {
      chartColumn1.push({image : this.getBase64ImageFromImage(chartImage[0]), fit : [900, 500], alignment : 'center',
       margin : [0, 0, 0, 0]});
      chartColumn1.push({image : this.getBase64ImageFromImage(chartImage[1]), fit : [900, 500], alignment : 'center',
       margin : [0, 0, 0, 0]});
       } else if(id == 'OT-wait'){
        chartColumn1.push({image : this.getBase64ImageFromImage(chartImage[0]), fit : [1020, 550], alignment : 'center',
        margin : [0, 0, 0, 0]});
        chartColumn2.push({image : this.getBase64ImageFromImage(chartImage[1]), fit : [1020, 550], alignment : 'center',
        margin : [0, 0, 0, 0]});
       } else if(id == 'porter-daily'){
        chartColumn1.push({image : this.getBase64ImageFromImage(chartImage[0]), fit : [600, 550], alignment : 'center',
        margin : [0, 10, 0, 0]});
        chartColumn2.push({image : this.getBase64ImageFromImage(chartImage[1]), fit : [600, 550], alignment : 'center',
        margin : [0, 0, 0, 0]});
       }
      else
      {
      chartColumn1.push({image : this.getBase64ImageFromImage(chartImage[0]), fit : [450, 500], alignment : 'center',
       margin : [10, 15, 10, 50]});
      chartColumn1.push({image : this.getBase64ImageFromImage(chartImage[1]), fit : [450, 500], alignment : 'center',
       margin : [10, 15, 10, 50]});
      }
    } else if (chartData.length >= 3){
      for (let i = 0 ; i < chartData.length ; i++) {
        if (i < 4 && json['age'] != undefined && json['age'].label.length > 0) {
          chartColumn1.push({image : this.getBase64ImageFromImage(chartImage[i]), fit : [200, 200], alignment : 'left',
          margin : [10, 15, 10, 25]});
        } else if(id == 'asset-summary'){
          chartColumn1.push({image : this.getBase64ImageFromImage(chartImage[i]), fit : [900, 400], alignment : 'center',
          margin : [10, 15, 10, 50]});
        } else if(id == 'porter-perf'){
          if(i<3){
            chartColumn1.push({image : this.getBase64ImageFromImage(chartImage[i]), fit : [400, 400], alignment : 'center',
            margin : [10, 15, 10, 50]});
          } else{
            chartColumn1.push({image : this.getBase64ImageFromImage(chartImage[i]), fit : [900, 400], alignment : 'center',
            margin : [10, 15, 10, 50]});
          }
        }else if (i < 3 && json['age'] == undefined && id != 'OT-utilz' && id != 'porter-req-summary' && id != 'ER-utilz') {
            chartColumn1.push({image : this.getBase64ImageFromImage(chartImage[i]), fit : [500, 500], alignment : 'left',
            margin : [10, 15, 10, 25]});
        } else if(id == 'OT-utilz' || id == 'ER-utilz'){
          if(i<2){
            chartColumn1.push({image : this.getBase64ImageFromImage(chartImage[i]), fit : [400, 400], alignment : 'left',
            margin : [10, 15, 10, 25]});
          } else if(i==2){
            chartColumn2.push({image : this.getBase64ImageFromImage(chartImage[i]), fit : [900, 500], alignment : 'center',
            margin : [10, 15, 10, 25]});
          } else if(i==3){
            chartColumn3.push({image : this.getBase64ImageFromImage(chartImage[i]), fit : [900, 500], alignment : 'center',
            margin : [10, 15, 10, 25]});
          } else if(i>=4){
            chartColumn4.push({image : this.getBase64ImageFromImage(chartImage[i]), fit : [1020, 550], alignment : 'left',
            margin : [10, 15, 10, 25]});
          } 
        } else if(id == 'porter-req-summary'){
          if(i==3){
            chartColumn2.push({image : this.getBase64ImageFromImage(chartImage[i]), fit : [900, 800], alignment : 'center',
            margin : [10, 15, 10, 25]});
          } else{
            chartColumn1.push({image : this.getBase64ImageFromImage(chartImage[i]), fit : [500, 500], alignment : 'left',
            margin : [10, 15, 10, 25]});
          }
          // else if(i>2){
          //   chartColumn2.push({image : this.getBase64ImageFromImage(chartImage[i]), fit : [600, 600], alignment : 'center',
          //   margin : [10, 15, 10, 25]});
          // } 
        }else if (i < 5 && json['age'] == undefined) {
          if(id == 'patient-status-op')
          {
            chartColumn2.push({image : this.getBase64ImageFromImage(chartImage[i]), fit : [400, 400], alignment : 'left',
           margin : [10, 15, 10, 10]});
          } 
          else
          {
            chartColumn2.push({image : this.getBase64ImageFromImage(chartImage[i]), fit : [400, 400], alignment : 'center',
           margin : [10, 15, 10, 10]});
          }
        } else if (i <= 5 && json['age'] != undefined && json['age'].label.length > 0) {
          chartColumn2.push({image : this.getBase64ImageFromImage(chartImage[i]), fit : [400, 400], alignment : 'center',
          margin : [10, 15, 10, 10]});
        } else if (i >= 5 && json['age'] == undefined) {
          if(id == 'patient-status-op')
          {
            if(i == 7)
              speciality.push();
            else{
              chartColumn3.push({image : this.getBase64ImageFromImage(chartImage[i]), fit : [800, 400], alignment : 'left',
              margin : [10, 15, 10, 10]});
            }
          }
          else{
            chartColumn3.push({image : this.getBase64ImageFromImage(chartImage[i]), fit : [800, 400], alignment : 'center',
           margin : [10, 15, 10, 10]});
          }
        }
      }
    }
    let table: any = [];
    let secondTable: any = [];
    let thirdTable: any = [];
    let fourthTable: any =[];
    let PS_table: any = [];
    let PS_table2: any = [];
    if (columns.length > 0 || id == 'porter-req-summary') {
      if(id == 'emp-geofencevio' || id == 'staff-geofencevio' || id == 'emp-attendance-all' || id == 'staff-attendance-all' || id == 'asset-geofencevio' || id == 'geofencevio' || id == 'student-attendance-all' || id == 'student-attendance-byclass' || id == 'sensor-water-leak'){
        table = this.table(json['Table'], columns);
      } 
      // }else{
      //   table = this.table(json, columns);
      // }
      if(id == 'sensor-utilz-byloc'){
        columns = Object.keys(json['Table'][0]);
        table = this.table(json['Table'], columns);
      }
      if (id == 'newborn-summary') {
        table = this.table(json['babyDetail'], columns);
        columns = Object.keys(json['InfantTablepdf'][0]);
        secondTable = this.table(json['InfantTablepdf'], columns);
        PS_table = {
          style : 'tableExample',
          table : {
            headerRows : 1,
            widths : [250, 250, 250, 250],
            body : [
              ['Baby Count', 'Additional Information', 'Other Information', 'Other'],
              [{
                ul : ['Number Of Babies : ' + json['numberOfBabies'] + '/' + json['numberOfMale'] + '(M),' + json['numberOfFemale'] + '(F)',
                      'Number Of Twins : ' + json['twins'],
                    ],
                style : {alignment : 'left', fontsize : 20, }
              },
              {
                ul : ['No. Of Babies Discharged Today : ' + json['babiesDischargedToday'],
                      'Number Of Staffs : ' + json['numberOfStaffs'],
                    ],
                style : {alignment : 'left', fontsize : 20, }
              },
              {
                ul : ['Ratio : ' + json['Ratio'],
                      'ALOS : ' + json['ALOS'],
                    ],
                style : {alignment : 'left', fontsize : 20,}
              },
                { text : json['geoAlertCount'], style : {alignment : 'center', fontsize : 20, }}
              ]
            ]
          }
        }
      } else if(id == 'asset-summary') {
          if(json['missingTable'].length>0){
            columns = Object.keys(json['missingTable'][0]);
            table = this.table(json['missingTable'],columns);
          }
          if(json['misplacedTable'].length>0){
            columns = Object.keys(json['misplacedTable'][0]);
            secondTable = this.table(json['misplacedTable'],columns);
          }
          if(json['transferTable'].length>0){
            columns = Object.keys(json['transferTable'][0]);
            thirdTable = this.table(json['transferTable'],columns);
          }
          if(json['geofenceTable'].length>0){
            columns = Object.keys(json['geofenceTable'][0]);
            fourthTable = this.table(json['geofenceTable'],columns);
          }
          PS_table = {
            style : 'tableExample',
            table : {
              headerRows : 1,
              widths : [150,150,150,150,150,150],
              body  : [
                ['No.Of Asset','Pending Calibration Due','Pending Amc Due','Missing Assets','Misplaced Assets','Transferred Assets'],
                [                
                  { text : json['assetCount'], style : {alignment : 'center', fontsize : 20, }},
                  { text : json['pendingCalibrationDue'], style : {alignment : 'center', fontsize : 20, }},
                  { text : json['pendingAmcDue'], style : {alignment : 'center', fontsize : 20, }},
                  { text : json['missingAsset'], style : {alignment : 'center', fontsize : 20, }},
                  { text : json['misplacedAsset'], style : {alignment : 'center', fontsize : 20, }},
                  { text : json['transferedAsset'], style : {alignment : 'center', fontsize : 20, }},
                ]
              ]
            }
          }
      }
      else if(id == 'asset-transfer')
      {
        columns=Object.keys(json['assetTransferDetailsByLocation'][0]);
        table = this.table(json['assetTransferDetailsByLocation'],columns);
        columns=Object.keys(json['assetTransferDetailsByFacility'][0]);
        secondTable=this.table(json['assetTransferDetailsByFacility'],columns);
        PS_table = {
          style : 'tableExample',
          table : {
            headerRows : 1,
            widths : [250,250,250,250],
            body : [
              ['Asset Movement Details'],
              [{ 
                ul : ['Total Assets : ' + json['totalAssets'],
                      'Assets Moved Within Hospital : ' + json['assettransferWithinHospital'],
                      'Assets Moved Outside Hospital : ' + json['assettransferOutsideHospital'],
                    ],
                style : {alignment : 'left', fontsize : 20,}
              }
              ]
            ]
          }
        }
      }
      else if(id == 'asset-misplaced')
      {
        columns=Object.keys(json['Table'][0]);
        table = this.table(json['Table'],columns);
        PS_table = {
          style : 'tableExample',
          table : {
            headerRows : 1,
            widths : [250,250,250,250],
            body : [
              ['Total Assets','Misplaced Assets'],
              [                
                { text : json['totalAssets'], style : {alignment : 'center', fontsize : 20, }},
                { text : json['misplacedAssets'], style : {alignment : 'center', fontsize : 20, }}
              ]
            ]
          }
        }
      }
      else if(id == 'asset-missing')
      {
        columns=Object.keys(json['Table'][0]);
        table = this.table(json['Table'],columns);
        PS_table = {
          style : 'tableExample',
          table : {
            headerRows : 1,
            widths : [250,250,250,250],
            body : [
              ['Total Assets','Missed Assets'],
              [                
                { text : json['totalAssets'], style : {alignment : 'center', fontsize : 20, }},
                { text : json['missedAssets'], style : {alignment : 'center', fontsize : 20, }}
              ]
            ]
          }
        }
      }
      else if(id == 'asset-utilz')
      {
        columns=Object.keys(json['Table'][0]);
        table = this.table(json['Table'],columns);
        PS_table = {
          style : 'tableExample',
          table : {
            headerRows : 1,
            widths : [250,250,250,250],
            body : [
              ['Total Utilization','Active Assets','Time Spent on Carearea','Time Spent on Non-Carearea'],
              [                
                { text : json['totalUtilization'], style : {alignment : 'center', fontsize : 20, }},
                { text : json['activeAssets'], style : {alignment : 'center', fontsize : 20, }},
                { text : json['careArea'], style : {alignment : 'center', fontsize : 20, }},
                { text : json['nonCareArea'], style : {alignment : 'center', fontsize : 20, }},
              ]
            ]
          }
        }
      } 
      else if(id == 'temporary-staff-summary')
      {
        columns=Object.keys(json['Table'][0]);
        table = this.table(json['Table'],columns);
        PS_table = {
          style : 'tableExample',
          table : {
            headerRows : 1,
            widths : [250,250,250,250],
            body : [
              ['Temporary staff And Alert Details'],
              [{ 
                ul : ['Total Temporary staff : ' + json['totalTempStaff'],
                      'Average Time : ' + json['avgTime'],
                      'SD Alerts : ' + json['sdAlert'],
                      'Geo Alerts : ' + json['geoAlert'],
                    ],
                style : {alignment : 'left', fontsize : 20,}
              }
              ]
            ]
          }
        }
      }
      else if(id == 'visitor-summary')
      {
        columns=Object.keys(json['Table'][0]);
        console.log(columns)
        table = this.table(json['Table'],columns);
        PS_table = {
          style : 'tableExample',
          table : {
            headerRows : 1,
            widths : [250,250,250,250],
            body : [
              ['Total Visitors','Average Time','SD Alerts','Geo Alerts'],
              [ { text : json['totalVisitors'], style : {alignment : 'center', fontsize : 20, }},
              { text : json['avgTime'], style : {alignment : 'center', fontsize : 20, }},
              { text : json['sdAlert'], style : {alignment : 'center', fontsize : 20, }},
              { text : json['geoAlert'], style : {alignment : 'center', fontsize : 20, }}
              ]
            ]
          }
        }
      }
      else if(id == 'emp-attendance-all')
      {
        columns=Object.keys(json['Table'][0]);
        //console.log(columns)
        table = this.table(json['Table'],columns);
        PS_table = {
          style : 'tableExample',
          table : {
            headerRows : 1,
            widths : [250,250,250,250],
            body : [
              ['Employee Attendance Details'],
              [{ 
                ul : ['Average Leave Taken : ' + json['leaveTotal'],
                      'Average Working Hours : ' + json['workingHours']
                    ],
                style : {alignment : 'left', fontsize : 20,}
              }
              ]
            ]
          }
        }
      }
      else if(id == 'staff-attendance-all')
      {
        columns=Object.keys(json['Table'][0]);
        //console.log(columns)
        table = this.table(json['Table'],columns);
        PS_table = {
          style : 'tableExample',
          table : {
            headerRows : 1,
            widths : [250,250,250,250],
            body : [
              ['Staff Attendance Details'],
              [{ 
                ul : ['Average Leave Taken : ' + json['leaveTotal'],
                      'Average Working Hours : ' + json['workingHours']
                    ],
                style : {alignment : 'left', fontsize : 20,}
              }
              ]
            ]
          }
        }
      }
      else if(id == 'student-attendance-all' || id == 'student-attendance-byclass')
      {
        columns=Object.keys(json['Table'][0]);
        //console.log(columns)
        table = this.table(json['Table'],columns);
        PS_table = {
          style : 'tableExample',
          table : {
            headerRows : 1,
            widths : [250,250,250,250],
            body : [
              ['Staff Attendance Details'],
              [{ 
                ul : ['Average Leave Taken : ' + json['leaveTotal'],
                      'Average Class Attendance (Hours) : ' + json['workingHours']
                    ],
                style : {alignment : 'left', fontsize : 20,}
              }
              ]
            ]
          }
        }
      }
      // else if(id == 'patientmove')
      // {
      //   columns=Object.keys(json['Table'][0]);
      //   table = this.table(json['Table'],columns);
      //   let requested = json['tileInfo'].filter(res => res.header == 'Requested')
      //   let rejected = json['tileInfo'].filter(res => res.header == 'Rejected')
      //   let completed = json['tileInfo'].filter(res => res.header == 'Completed')
      //   let inprogress = json['tileInfo'].filter(res => res.header == 'Inprogress')
      //   let numOfPorter = json['tileInfo'].filter(res => res.header == 'Number Of Porters')
      //   PS_table = {
      //     style : 'tableExample',
      //     table : {
      //       headerRows : 1,
      //       widths : [200, 200, 200, 200, 200],
      //       body : [
      //         ['Number Of Porters','Requested', 'Rejected', 'Completed', 'Inprogress'],
      //         [
      //           { text : numOfPorter[0].content[0], style : {alignment : 'center', fontsize : 20, }},
      //           { text : requested[0].content, style : {alignment : 'center', fontsize : 20, }},
      //           { text : rejected[0].content, style : {alignment : 'center', fontsize : 20, }},
      //           { text : completed[0].content, style : {alignment : 'center', fontsize : 20, }},
      //           { text : inprogress[0].content, style : {alignment : 'center', fontsize : 20, }}
      //         ]
      //       ]
      //     }
      //   }
      // }
      else if(id == 'porter-byward')
      {
        columns=Object.keys(json['Table'][0]);
        table = this.table(json['Table'],columns);
        let totPor = json['tileInfo'].filter(res => res.header == 'Total Porter')
        let avgComTime = json['tileInfo'].filter(res => res.header == 'Average Completion Time')
        let arrToComp = json['tileInfo'].filter(res => res.header == 'TAT: Arrive To Completion')
        let crToArrive = json['tileInfo'].filter(res => res.header == 'TAT: Assigned To Arrive')
        let crToComp = json['tileInfo'].filter(res => res.header == 'TAT: Assigned To Complete')
        let movIn = json['tileInfo'].filter(res => res.header == 'Movement IN')
        let movOut = json['tileInfo'].filter(res => res.header == 'Movement OUT')
        PS_table = {
          style : 'tableExample',
          table : {
            headerRows : 1,
            widths : [150, 150, 150, 150, 150, 150, 150],
            body : [
              ['Total Porter', 'Average Completion Time','TAT: Arrive To Completion','TAT: Assigned To Arrive','TAT: Assigned To Complete', 'Movement IN', 'Movement OUT'],
              [
                { text : totPor[0].content, style : {alignment : 'center', fontsize : 20, }},
                { text : avgComTime[0].content, style : {alignment : 'center', fontsize : 20, }},
                { text : arrToComp[0].content, style : {alignment : 'center', fontsize : 20, }},
                { text : crToArrive[0].content, style : {alignment : 'center', fontsize : 20, }},
                { text : crToComp[0].content, style : {alignment : 'center', fontsize : 20, }},
                { text : movIn[0].content, style : {alignment : 'center', fontsize : 20, }},
                { text : movOut[0].content, style : {alignment : 'center', fontsize : 20, }},
              ]
            ]
          }
        }
      }
      else if(id == 'othreq-move' || id == 'patientmove' || id == 'porter-req-summary')
      {
        if(id == 'porter-req-summary'){
          if(json['performanceTable'].length>0){
            columns=Object.keys(json['performanceTable'][0]);
            table = this.table(json['performanceTable'],columns);
          }
          if(json['PorterIdleTable'].length>0){
            let tableCol;
            tableCol=Object.keys(json['PorterIdleTable'][0]);
            thirdTable = this.table(json['PorterIdleTable'],tableCol);
          }
          if(json['dateWiseSummary'].length>0){
            let dateTblCol;
            dateTblCol=Object.keys(json['dateWiseSummary'][0]);
            fourthTable = this.table(json['dateWiseSummary'],dateTblCol);
          }
        } else if(id == 'othreq-move'){
          if(json['performanceTable'].length>0){
            columns=Object.keys(json['performanceTable'][0]);
            table = this.table(json['performanceTable'],columns);
          }
          if(json['PorterIdleTable'].length>0){
            let tableCol;
            tableCol=Object.keys(json['PorterIdleTable'][0]);
            thirdTable = this.table(json['PorterIdleTable'],tableCol);
          }
        } else{
          if(json['Table'].length>0){
            columns=Object.keys(json['Table'][0]);
            table = this.table(json['Table'],columns);
          }
        }
        if(json['locationTable'].length>0){
          let columns2: any[] ;
          columns2 = Object.keys(json['locationTable'][0]);
          secondTable = this.table(json['locationTable'],columns2);
        }
        let requests = json['tileInfo'].filter(res => res.header == 'Total Requests')
        let completed = json['tileInfo'].filter(res => res.header == 'Total Completed')
        let cancellation = json['tileInfo'].filter(res => res.header == 'Total Cancellation')
        let waitlist = json['tileInfo'].filter(res => res.header == 'Total Waitlist')
        let create = json['tileInfo'].filter(res => res.header == 'TAT: Assigned To Complete')
        if(id == 'porter-req-summary'){
          let totpor = json['tileInfo'].filter(res => res.header == 'Total Porter')
          let totShift = json['tileInfo'].filter(res => res.header == 'Total Shifts')
          let shiftTim = json['tileInfo'].filter(res => res.header == 'Avg Shifts Time')
          let Requests = json['tileInfo'].filter(res => res.header == 'Requests')
          let Completed = json['tileInfo'].filter(res => res.header == 'Completed')
          let Cancellation = json['tileInfo'].filter(res => res.header == 'Cancellation')
          let Waitlist = json['tileInfo'].filter(res => res.header == 'Waitlist')
          let Open = json['tileInfo'].filter(res => res.header == 'Open')
          let Scheduled = json['tileInfo'].filter(res => res.header == 'Scheduled/Planned')
          let waitComp = json['tileInfo'].filter(res => res.header == 'Waitlist Completed')
          let crToco = json['tileInfo'].filter(res => res.header == 'Create To Complete')
          let crToAc = json['tileInfo'].filter(res => res.header == 'Create To Accept')
          let crToAr = json['tileInfo'].filter(res => res.header == 'Accept To Arrive')
          let ArToCm = json['tileInfo'].filter(res => res.header == 'Arrive To Complete')
          let selfReq = json['tileInfo'].filter(res => res.header == 'Self Requests')
          let tatSelf = json['tileInfo'].filter(res => res.header == 'TAT:Self Request')
          PS_table = {
            style : 'tableExample',
            table : {
              headerRows : 1,
              widths : [100, 100, 100,100,100,100,100,100,100],
              body : [
                ['Total Porter', 'Total Shifts','Avg Shifts Time','Requests', 'Completed','Cancellation','Waitlist','Open','Scheduled/Planned'],
                [
                  { text : totpor[0].content, style : {alignment : 'center', fontsize : 20, }},
                  { text : totShift[0].content, style : {alignment : 'center', fontsize : 20, }},
                  { text : shiftTim[0].content, style : {alignment : 'center', fontsize : 20, }},
                  { text : Requests[0].content, style : {alignment : 'center', fontsize : 20, }},
                  { text : Completed[0].content, style : {alignment : 'center', fontsize : 20, }},
                  { text : Cancellation[0].content, style : {alignment : 'center', fontsize : 20, }},
                  { text : Waitlist[0].content, style : {alignment : 'center', fontsize : 20, }},
                  { text : Open[0].content, style : {alignment : 'center', fontsize : 20, }},
                  { text : Scheduled[0].content, style : {alignment : 'center', fontsize : 20, }},
                ]
              ]
            }
          }
          PS_table2 = {
            style : 'tableExample',
            table : {
              headerRows : 1,
              widths : [100,100,100,100,100,100,100],
              body : [
                ['Waitlist Completed','Create To Complete','Create To Accept','Accept To Arrive','Arrive To Complete','Self Requests','TAT:Self Request'],
                [
                  { text : waitComp[0].content, style : {alignment : 'center', fontsize : 20, }},
                  { text : crToco[0].content, style : {alignment : 'center', fontsize : 20, }},
                  { text : crToAc[0].content, style : {alignment : 'center', fontsize : 20, }},
                  { text : crToAr[0].content, style : {alignment : 'center', fontsize : 20, }},
                  { text : ArToCm[0].content, style : {alignment : 'center', fontsize : 20, }},
                  { text : selfReq[0].content, style : {alignment : 'center', fontsize : 20, }},
                  { text : tatSelf[0].content, style : {alignment : 'center', fontsize : 20, }},
                ]
              ]
            }
          }
        } else{
          let tat = json['tileInfo'].filter(res => res.header == 'TAT: Arrive To Completion')
          let time = json['tileInfo'].filter(res => res.header == 'TAT: Assigned To Arrive')
          let totalPorter = json['tileInfo'].filter(res => res.header == 'Total Porter(man days)')
          PS_table = {
            style : 'tableExample',
            table : {
              headerRows : 1,
              widths : [130, 130, 130,130,130,130,130,130],
              body : [
                ['Total Porter(man days)', 'Total Requests','Total Completed', 'Total Cancellation','Total Waitlist','TAT: Arrive To Completion','TAT: Assigned To Arrive','TAT: Assigned To Complete'],
                [
                  { text : totalPorter[0].content, style : {alignment : 'center', fontsize : 20, }},
                  { text : requests[0].content, style : {alignment : 'center', fontsize : 20, }},
                  { text : completed[0].content, style : {alignment : 'center', fontsize : 20, }},
                  { text : cancellation[0].content, style : {alignment : 'center', fontsize : 20, }},
                  { text : waitlist[0].content, style : {alignment : 'center', fontsize : 20, }},
                  { text : tat[0].content, style : {alignment : 'center', fontsize : 20, }},
                  { text : time[0].content, style : {alignment : 'center', fontsize : 20, }},
                  { text : create[0].content, style : {alignment : 'center', fontsize : 20, }},
                ]
              ]
            }
          }
        }
      } else if(id == 'nurse-call-sum'){
        let totalStaff = json['tileInfo'].filter(res => res.header == 'Total Staff')
        let requests = json['tileInfo'].filter(res => res.header == 'Total Requests')
        let completed = json['tileInfo'].filter(res => res.header == 'Total Completed')
        let cancellation = json['tileInfo'].filter(res => res.header == 'Total Cancellation')
        let crtocm = json['tileInfo'].filter(res => res.header == 'Avg.TAT Create to Complete')
        PS_table = {
          style : 'tableExample',
          table : {
            headerRows : 1,
            widths : [200, 200, 200,200,200],
            body : [
              ['Total Staff', 'Total Requests','Total Completed','Total Cancellation', 'Avg.TAT Create to Complete'],
              [
                { text : totalStaff[0].content, style : {alignment : 'center', fontsize : 20, }},
                { text : requests[0].content, style : {alignment : 'center', fontsize : 20, }},
                { text : completed[0].content, style : {alignment : 'center', fontsize : 20, }},
                { text : cancellation[0].content, style : {alignment : 'center', fontsize : 20, }},
                { text : crtocm[0].content, style : {alignment : 'center', fontsize : 20, }},
              ]
            ]
          }
        }
      }else if(id == 'asset-move'){
        columns=Object.keys(json['performanceTable'][0]);
        table = this.table(json['performanceTable'],columns);
        let tableCol;
        tableCol=Object.keys(json['PorterIdleTable'][0]);
        thirdTable = this.table(json['PorterIdleTable'],tableCol);
        let columns2: any[] ;
        columns2 = Object.keys(json['locationTable'][0]);
        secondTable = this.table(json['locationTable'],columns2);
        let totalPorter = json['tileInfo'].filter(res => res.header == 'Total Porter(man days)')
        let requests = json['tileInfo'].filter(res => res.header == 'Total Requests')
        let cancellation = json['tileInfo'].filter(res => res.header == 'Total Cancellation')
        let waitlist = json['tileInfo'].filter(res => res.header == 'Total Waitlist')
        let tat = json['tileInfo'].filter(res => res.header == 'TAT: Arrive To Completion')
        let time = json['tileInfo'].filter(res => res.header == 'TAT: Assigned To Arrive')
        let create = json['tileInfo'].filter(res => res.header == 'TAT: Assigned To Complete')
        let shift = json['tileInfo'].filter(res => res.header == 'Shift Time')
        PS_table = {
          style : 'tableExample',
          table : {
            headerRows : 1,
            widths : [150, 150, 150,150,150,150,150,150],
            body : [
              ['Total Porter(man days)', 'Total Requests', 'Total Cancellation','Total Waitlist','Shift Time','TAT: Arrive To Completion','TAT: Assigned To Arrive','TAT: Assigned To Complete'],
              [
                { text : totalPorter[0].content, style : {alignment : 'center', fontsize : 20, }},
                { text : requests[0].content, style : {alignment : 'center', fontsize : 20, }},
                { text : cancellation[0].content, style : {alignment : 'center', fontsize : 20, }},
                { text : waitlist[0].content, style : {alignment : 'center', fontsize : 20, }},
                { text : shift[0].content, style : {alignment : 'center', fontsize : 20, }},
                { text : tat[0].content, style : {alignment : 'center', fontsize : 20, }},
                { text : time[0].content, style : {alignment : 'center', fontsize : 20, }},
                { text : create[0].content, style : {alignment : 'center', fontsize : 20, }},
              ]
            ]
          }
        }
      }
      else if(id == 'visitor-site-nav')
      {
        columns=Object.keys(json['tableData'][0]);
        table = this.table(json['tableData'],columns);
        PS_table = {
          style : 'tableExample',
          table : {
            headerRows : 1,
            widths : [330],
            body : [
              ['Visitor Details'],
              [
                {
                ul : ['Visitor Id : ' + json['porterRequested'],
                      'Name : ' + json['porterAccepted'],
                      'Gender : ' + json['porterCompleted']
                    ],
                style : {alignment : 'left', fontsize : 20, }
              }
              ]
            ]
          }
        }
      }
      else if(id == 'roll-call')
      {
        columns=Object.keys(json['Table'][0]);
        table = this.table(json['Table'],columns);
        PS_table = {
          style : 'tableExample',
          table : {
            headerRows : 1,
            widths : [200, 200, 200, 200, 200],
            body : [
              ['Number Of Employees Present/Assembled', 'Number Of Employees Missing', 'Number Of Visitors', 'Number Of Visitors Missing', 'Event Starttime'],
              [
                { text : json['totalEmployeeIn'], style : {alignment : 'center', fontsize : 20, }},
                { text : json['empmissing'], style : {alignment : 'center', fontsize : 20, }},
                { text : json['visitors'], style : {alignment : 'center', fontsize : 20, }},
                { text : json['visitormissing'], style : {alignment : 'center', fontsize : 20, }},
                { text : json['eventStartingTime'], style : {alignment : 'center', fontsize : 20, }},
              ]
            ]
          }
        }
      }
      else if(id == 'staff-roll-call')
      {
        columns=Object.keys(json['Table'][0]);
        table = this.table(json['Table'],columns);
        PS_table = {
          style : 'tableExample',
          table : {
            headerRows : 1,
            widths : [200, 200, 200, 200, 200],
            body : [
              ['Number Of Staff Present/Assembled', 'Number Of Staff Missing', 'Number Of Visitors', 'Number Of Visitors Missing', 'Event Starttime'],
              [
                { text : json['totalEmployeeIn'], style : {alignment : 'center', fontsize : 20, }},
                { text : json['empmissing'], style : {alignment : 'center', fontsize : 20, }},
                { text : json['visitors'], style : {alignment : 'center', fontsize : 20, }},
                { text : json['visitormissing'], style : {alignment : 'center', fontsize : 20, }},
                { text : json['eventStartingTime'], style : {alignment : 'center', fontsize : 20, }},
              ]
            ]
          }
        }
      }
      // else if(id == 'asset-move')
      // {
      //   columns=Object.keys(json['Table'][0]);
      //   table = this.table(json['Table'],columns);
      //   PS_table = {
      //     style : 'tableExample',
      //     table : {
      //       headerRows : 1,
      //       widths : [250,250,250,250],
      //       body : [
      //         ['Asset and Porter Count','Asset Movement Details','Porter Status Count','No. Of Assets In Common Area'],
      //         [
      //           { 
      //             ul : ['Number Of Assets : ' + json['numberOfAssets'],
      //                   'Number Of Porters : ' + json['numberOfPorters'],
      //                 ],
      //             style : {alignment : 'left', fontsize : 20,}
      //           } , 
      //           { 
      //             ul : ['No. Of Asset Movement : ' + json['assetMovementCount']
      //                 ],
      //             style : {alignment : 'left', fontsize : 20,}
      //           }  ,
      //           { 
      //           ul : ['Requested : ' + json['porterRequested'],
      //                 'Rejected : ' + json['porterRejected'],
      //                 'Completed : ' + json['porterCompleted'],
      //                 'Inprogress : ' + json['porterInprogress'],
      //               ],
      //           style : {alignment : 'left', fontsize : 20,}
      //         }  ,
      //         { text : json['commonAreaAssetCount'], style : {alignment : 'center', fontsize : 20,}}  
      //         ]
      //       ]
      //     }
      //   }
      // }
      else if(id == 'nurse-call')
      {
        columns=Object.keys(json['Table'][0]);
        table = this.table(json['Table'],columns);
        PS_table = {
          // style : 'tableExample',
          // table : {
          //   headerRows : 1,
          //   widths : [330,330,330],
          //   body : [
          //     ['Number Of Nurses','Nurse Call TAT','Nurse Ratio'],
          //     [
          //       { 
          //         ul : ['Number Of Nurses : ' + json['totalNurses']
          //             ],
          //         style : {alignment : 'left', fontsize : 20,}
          //       },
          //       { 
          //         ul : ['Ward : ' + json['nursesCallTatInWard'],
          //               'ICU : ' + json['nursesCallTatInIcu'],
          //             ],
          //         style : {alignment : 'left', fontsize : 20,}
          //       },    
          //       { 
          //       ul : ['Ward : ' + json['nursesCallRatioInWard'],
          //             'ICU : ' + json['nursesCallRatioInIcu'],
          //           ],
          //       style : {alignment : 'left', fontsize : 20,}
          //     }      
          //     ]
          //   ]
          // }
        }
      } else if(id == 'pat-mrid-list'){
        PS_table = {
          style : 'tableExample',
          table : {
            headerRows : 1,
            widths : [250],
            body  : [
              ['Total Tags'],
              [
                { text : json['totalTags'], style : {alignment : 'center', fontsize : 20, }},
              ]
            ]
          }
        }
      }
      else if(id == 'emp-summary-rep' || id == 'staff-summary-rep')
      {
        if(json['Table'].length > 0){
          columns = Object.keys(json['Table'][0]);
          console.log(columns)
          table = this.table(json['Table'],columns);
        }
        if(json['alert'].length > 0){
          secondTable = this.table(json['alert'],json['alertColumns'])
        }
        PS_table = {
          style : 'tableExample',
          table : {
            headerRows : 1,
           widths : [200, 200, 200, 200, 200],
            //widths : [250, 250, 250, 250, 200],

            body : [
              ['Strength', 'Number Of Staffs Absent', 'SD Alert Count', 'Geo Alert Count', 'Number Of Visitors'],
              [
                { text : json['fullData']['Strength'][0]['Count'], style : {alignment : 'center', fontsize : 20,}},
                { text : json['fullData']['Absent'][0]['Count'], style : {alignment : 'center', fontsize : 20,}},
                { text : json['fullData']['SD Alert Count'][0]['Count'], style : {alignment : 'center', fontsize : 20,}},
                { text : json['fullData']['Geo Alert Count'][0]['Count'], style : {alignment : 'center', fontsize : 20,}},
                { text : json['fullData']['Visitor'][0]['Count'], style : {alignment : 'center', fontsize : 20,}}  
              ]
            ]
          }
        }
      } else if(id == 'battery-summary' || id == 'staff-battery-summary')
      {
        if(json['Table'].length > 0){
          columns = Object.keys(json['Table'][0]);
          table = this.table(json['Table'],columns);
        }
        if(id == 'battery-summary'){
        PS_table = {
          style : 'tableExample',
          table : {
            headerRows : 1,
           widths : [200, 200],
            //widths : [250, 250, 250, 250, 200],

            body : [
              ['total Number of Tags', 'Tags with zero battery'],
              [
                { text : json['TableLength'], style : {alignment : 'center', fontsize : 20,}},
                { text : json['zeroData'], style : {alignment : 'center', fontsize : 20,}}, 
              ]
            ]
          }
        }
      }
      } else if(id == 'porter-perf-trend'){
        if(json['Table'].length > 0){
          columns = Object.keys(json['Table'][0]);
          table = this.table(json['Table'],columns);
        }
      }
    } else if(id == 'porter-daily'){
      let porterNeeded = json['tileInfo'].filter(res => res.header == 'Porters Needed Today')
      let bestPerformer = json['tileInfo'].filter(res => res.header == 'Best Performer')
      let avgTimeGetPorter = json['tileInfo'].filter(res => res.header == 'Avg.time to get Porter(mins)')
      let peakHrs = json['tileInfo'].filter(res => res.header == 'Peak Hours')
      PS_table = {
        style : 'tableExample',
        table : {
          headerRows : 1,
          widths : [250, 250, 250, 250],
          body : [
            ['Porters Needed Today', 'Best Performer', 'Avg.time to get Porter(mins)', 'Peak Hours'],
            [
              { text : porterNeeded[0]?.content, style : {alignment : 'center', fontsize : 20, }},
              { text : bestPerformer[0]?.content, style : {alignment : 'center', fontsize : 20, }},
              { text : avgTimeGetPorter[0]?.content, style : {alignment : 'center', fontsize : 20, }},
              { text : peakHrs[0]?.content, style : {alignment : 'center', fontsize : 20, }}
            ]
          ]
        }
      }
    } else if(id == 'pat-routin-sumary' || id == 'stf-routin-sumary'){
        if(json['categoryTable'].length>0){
          columns=Object.keys(json['categoryTable'][0]);
          table = this.table(json['categoryTable'],columns);
        }
        let totStaff = json['tileInfo'].filter(res => res.header == 'Total Staff')
        let request = json['tileInfo'].filter(res => res.header == 'Total Requests(Activities)')
        let completed = json['tileInfo'].filter(res => res.header == 'Completed')
        let pending = json['tileInfo'].filter(res => res.header == 'Pending')
        if(id == 'pat-routin-sumary'){
          let totalPatient = json['tileInfo'].filter(res => res.header == 'Total Patients')
          PS_table = {
            style : 'tableExample',
            table : {
              headerRows : 1,
              widths : [200, 200, 200,200,200],
              body : [
                ['Total Patients', 'Total Staff','Total Requests(Activities)','Completed', 'Pending'],
                [
                  { text : totalPatient[0].content, style : {alignment : 'center', fontsize : 20, }},
                  { text : totStaff[0].content, style : {alignment : 'center', fontsize : 20, }},
                  { text : request[0].content, style : {alignment : 'center', fontsize : 20, }},
                  { text : completed[0].content, style : {alignment : 'center', fontsize : 20, }},
                  { text : pending[0].content, style : {alignment : 'center', fontsize : 20, }},
                ]
              ]
            }
          }
        } else {
          PS_table = {
            style : 'tableExample',
            table : {
              headerRows : 1,
              widths : [250, 250, 250,250],
              body : [
                ['Total Staff','Total Requests(Activities)','Completed', 'Pending'],
                [
                  { text : totStaff[0].content, style : {alignment : 'center', fontsize : 20, }},
                  { text : request[0].content, style : {alignment : 'center', fontsize : 20, }},
                  { text : completed[0].content, style : {alignment : 'center', fontsize : 20, }},
                  { text : pending[0].content, style : {alignment : 'center', fontsize : 20, }},
                ]
              ]
            }
          }
        }
    }
    else if((json['package_customized'] != null || json['package_customized'] != undefined) && id != 'patient-status-op'){
      PS_table = {
        style : 'tableExample',
        table : {
          headerRows : 1,
          widths : [400, 200, 200, 200],
          body : [
            ['TAT By Diabetic Patients','Number of Pregnant Patients','Number of packages customized by Patients','Number of Patients with No Plans'],
            [{ 
              ul : ['Diabetic Patients :  ' + json['diabetic']['Diabetic']['Avg TAT'] + ' / (' + json['diabetic']['Diabetic']['Count'] + ')',
                    'Non Diabetic Patients :  ' + json['diabetic']['Non Diabetic']['Avg TAT'] + ' / (' + json['diabetic']['Non Diabetic']['Count'] + ')',
                  ],
              style : {alignment : 'left', fontsize : 20,}
            },
              { text : json['pragnant']['data'], style : {alignment : 'center', fontsize : 20,}},
              { text : json['package_customized']['data'], style : {alignment : 'center', fontsize : 20,}},
              { text : json['noplan']['data'], style : {alignment : 'center', fontsize : 20,}}
            ]
          ]
        }
      }
    } else if(json['bedOccupancyRate'] != null || json['bedOccupancyRate'] != undefined){
      PS_table = {
        style : 'tableExample',
        table : {
          headerRows : 1,
          widths : [300, 300, 200, 200],
          body : [
            ['Admission Count','Beds Availability','Bed Occupancy Rate','ALOS'],
            [{ 
              ul : ['Admitted : ' + json['admitted'],
                    'Discharged : ' + json['discharged'],
                  ],
              style : {alignment : 'left', fontsize : 20,}
            },
            { 
              ul : ['Occupied : ' + json['bedsOccupied'],
                    'Available : ' + json['bedsAvailable'],
                  ],
              style : {alignment : 'left', fontsize : 20,}
            },
              { text : json['bedOccupancyRate'], style : {alignment : 'center', fontsize : 20,}},
              { text : json['ALOS'], style : {alignment : 'center', fontsize : 20,}}
            ]
          ]
        }
      }
    } else if(id == 'maintenancerep')
    {
      PS_table = {
        style : 'tableExample',
        table : {
          headerRows : 1,
          widths : [200, 200, 200],
          body : [
            ['Tags', 'Reader', 'Gateway'],
            [
              { text : json['tot_tag']['data'], style : {alignment : 'center', fontsize : 20,}},
              { text : json['tot_reader']['data'], style : {alignment : 'center', fontsize : 20,}},
              { text : json['tot_gw']['data'], style : {alignment : 'center', fontsize : 20,}}
            ]
          ]
        }
      }
    } else if(id == 'asset-summary')
    {
      columns = Object.keys(json['missingTable'][0]);
      table = this.table(json['missingTable'],columns);
      PS_table = {
        style : 'tableExample',
        table : {
          headerRows : 1,
          widths : [150,150,150,150,150,150],
          body  : [
            // ['No.Of Asset','Pending Calibration Due','Pending Amc Due','Battery Status'],
            ['No.Of Asset','Pending Calibration Due','Pending Amc Due','Missing Assets','Misplaced Assets','Transferred Assets'],
            [                
              { text : json['assetCount'], style : {alignment : 'center', fontsize : 20, }},
              { text : json['pendingCalibrationDue'], style : {alignment : 'center', fontsize : 20, }},
              { text : json['pendingAmcDue'], style : {alignment : 'center', fontsize : 20, }},
              { text : json['missingAsset'], style : {alignment : 'center', fontsize : 20, }},
              { text : json['misplacedAsset'], style : {alignment : 'center', fontsize : 20, }},
              { text : json['Transferred Assets'], style : {alignment : 'center', fontsize : 20, }},
              //{ text : json['batteryStatus'], style : {alignment : 'center', fontsize : 20, }}
            ]
          ]
        }
      }
    } else if(id == 'porter-perf')
    {
      let porters = json['tileInfo'].filter(res => res.header == 'No. of Porters')
      let requested = json['tileInfo'].filter(res => res.header == 'No. of Requests(Completed)')
      let completion = json['tileInfo'].filter(res => res.header == 'TAT: Arrive To Completion')
      let timeattend = json['tileInfo'].filter(res => res.header == 'TAT: Assigned To Arrive')
      let complete = json['tileInfo'].filter(res => res.header == 'TAT: Assigned To Complete')
      PS_table = {
        style : 'tableExample',
        table : {
          headerRows : 1,
          widths : [200, 200, 200, 200, 200],
          body : [
            ['No. of Porters', 'No. of Requests(Completed)', 'TAT: Arrive To Completion', 'TAT: Assigned To Arrive','TAT: Assigned To Complete'],
            [
              { text : porters[0].content, style : {alignment : 'center', fontsize : 20, }},
              { text : requested[0].content, style : {alignment : 'center', fontsize : 20, }},
              { text : completion[0].content, style : {alignment : 'center', fontsize : 20, }},
              { text : timeattend[0].content, style : {alignment : 'center', fontsize : 20, }},
              { text : complete[0].content, style : {alignment : 'center', fontsize : 20, }},
            ]
          ]
        }
      }
    }
    else if(json['error_log'] != null || json['error_log'] != undefined){
      console.log("errrr")
      PS_table = {
        style : 'tableExample',
        table : {
          headerRows : 1,
          widths : [400, 200, 200, 0],
          body : [
          ]
        }
      }
    }
    let footer = function(page, pages) {
      return {
        margin: [5, 20, 10, 5],
        height: 30,
        columns: [
        {
           alignment: "center",
           text: [
             { text: page.toString(), italics: true },
               " of ",
             { text: pages.toString(), italics: true }
           ]
        }]
      }
    };

    let header = {
      margin: [50, 20, 20, 5],
      height : 80,
      columns : [
        {image : await this.getBase64ImageFromURL(this.imageData),fit : [150, 75], alignment : 'left'},
      ]
    };
    let content = null;
    if (id == 'newborn-summary') {
      content =  [
        {text : this.nowFacility, alignment : 'center', bold : 'true', fontsize : 30},
        {text : 'NEW BORN - MOTHER SUMMARY', alignment : 'center', bold : 'true', fontsize : 30},
        {
          margin : [5, 20, 20, 5],
          columns : [
            {text : 'Report Name :' + name.toUpperCase(), alignment : 'left'},
            {text : 'Generated On :' + this.datepipe.transform(new Date().getTime(), 'yyyy-MM-dd HH:mm:ss'), alignment : 'right'}
          ]
        },
        {
          margin : [5, 5, 20, 20],
          text : 'Report Date :' + selectedDate, alignment : 'left'
        },
        PS_table,
        {
          margin : [20, 20, 20, 20],
          columns : [chartColumn1, secondTable]
        },
        {
          margin : [20, 20, 20, 20],
          columns : [chartColumn2]
        },
        {columns : [chartColumn3]},
        {
          margin : [5, 20, 20, 20],
          columns: [
            table
          ]
        },
      ];
    }
    else if(id == 'asset-transfer')
    {
      content =  [
        {text : this.nowFacility, alignment : 'center', bold : 'true', fontsize : 30},
        {text : 'ASSET TRANSFER REPORT', alignment : 'center', bold : 'true', fontsize : 30},
        {
          margin : [5,20,20,5],
          columns : [
            {text : 'Report Name :' + name.toUpperCase(), alignment : 'left'},
            {text : 'Generated On :' + this.datepipe.transform(new Date().getTime(), 'yyyy-MM-dd HH:mm:ss'), alignment : 'right'}
          ]
        },
        {
          margin : [5,5,20,20],
          text : 'Report Date :' + selectedDate, alignment : 'left'
        },
        PS_table,
        {
          margin : [5,20,20,5],
          columns : [chartColumn1[0],chartColumn1[1]],
        },
        {
          margin : [5,20,20,20],
          columns: [
            table , secondTable  
          ]
        },
        
      ];
    }
    // else if(id == 'patientmove')
    // {
    //   chartColumn1[0].fit = [900,500];
    //   chartColumn1[1].fit = [900,500];
    //   content =  [
    //     {text : 'DIGITAL QUEUE', alignment : 'center', bold : 'true', fontsize : 30},
    //     {
    //       margin : [5, 20, 20, 5],
    //       columns : [
    //         {text : 'Report Name :' + name.toUpperCase(), alignment : 'left'},
    //         {text : 'Generated On :' + this.datepipe.transform(new Date().getTime(), 'yyyy-MM-dd HH:mm:ss'), alignment : 'right'}
    //       ]
    //     },
    //     {
    //       margin : [5, 5, 20, 20],
    //       text : 'Report Date :' + selectedDate, alignment : 'left'
    //     },
    //     PS_table,
    //     {
    //       margin : [20, 20, 20, 20],
    //       columns : [chartColumn1],
    //     },
    //     {
    //       margin : [20, 20, 20, 20],
    //       columns : [chartColumn2]
    //     },
    //     {columns : [chartColumn3]},
    //     {
    //       margin : [5, 20, 20, 20],
    //       columns: [
    //         table
    //       ]
    //     },
    //   ];
    // }
    else if(id == 'porter-byward')
    {
      chartColumn1[0].fit = [300,600];
      chartColumn1[1].fit = [500,600];
      content =  [
        {text : this.nowFacility, alignment : 'center', bold : 'true', fontsize : 30},
        {text : 'PORTER REPORT FOR WARD', alignment : 'center', bold : 'true', fontsize : 30},
        {
          margin : [5, 20, 20, 5],
          columns : [
            {text : 'Report Name :' + name.toUpperCase(), alignment : 'left'},
            {text : 'Generated On :' + this.datepipe.transform(new Date().getTime(), 'yyyy-MM-dd HH:mm:ss'), alignment : 'right'}
          ]
        },
        {
          margin : [5, 5, 20, 20],
          text : 'Report Date :' + selectedDate, alignment : 'left'
        },
        PS_table,
        {
          margin : [20, 20, 20, 20],
          columns : [chartColumn1[0],chartColumn1[1]],
        },
        {
          margin : [5, 20, 20, 20],
          columns: [
            table
          ]
        },
      ];
    }
    else if(id == 'patientmove')
    {
      chartColumn1[0].fit = [900,500];
      content =  [
        {text : this.nowFacility, alignment : 'center', bold : 'true', fontsize : 30},
        {text : 'PORTER MOVEMENT REPORT', alignment : 'center', bold : 'true', fontsize : 30},
        {
          margin : [5, 20, 20, 5],
          columns : [
            {text : 'Report Name :' + name.toUpperCase(), alignment : 'left'},
            {text : 'Generated On :' + this.datepipe.transform(new Date().getTime(), 'yyyy-MM-dd HH:mm:ss'), alignment : 'right'}
          ]
        },
        {
          margin : [5, 5, 20, 20],
          columns : [
          {text : 'Report Date :' + addInfo['fromDate'] + ' - ' +selectedDate, alignment : 'left'},]
        },
        PS_table,
        {
          margin : [20, 20, 20, 20],
          columns : [chartColumn1],
        },
        {
          margin : [20, 20, 20, 20],
          columns : [chartColumn2]
        },
        {
          margin : [5, 20, 5, 2],
          columns : [
            {text : 'Locationwise Movement Summary', alignment : 'left',bold : 'true', fontsize : 40}
          ]
        },
        {
          margin : [5, 2, 20, 20],
          columns : [secondTable]
        },
        {
          margin : [5, 20, 5, 2],
          columns : [
            {text : 'List of Porter Requests', alignment : 'left',bold : 'true', fontsize : 40}
          ]
        },
        {
          margin : [5, 20, 20, 20],
          columns: [
            table
          ]
        },
      ];
    }
    else if(id == 'othreq-move' || id == 'asset-move'){
      chartColumn1[0].fit = [900,500];
      content =  [
        {text : this.nowFacility, alignment : 'center', bold : 'true', fontsize : 30},
        {text : 'PORTER OTHER REQUEST SUMMARY', alignment : 'center', bold : 'true', fontsize : 30},
        {
          margin : [5, 20, 20, 5],
          columns : [
            {text : 'Report Name :' + name.toUpperCase(), alignment : 'left'},
            {text : 'Generated On :' + this.datepipe.transform(new Date().getTime(), 'yyyy-MM-dd HH:mm:ss'), alignment : 'right'}
          ]
        },
        {
          margin : [5, 5, 20, 20],
          columns : [
          {text : 'Report Date :' + addInfo['fromDate'] + ' - ' +selectedDate, alignment : 'left'},]
        },
        PS_table,
        {
          margin : [20, 20, 20, 20],
          columns : [chartColumn1],
        },
        {
          margin : [20, 20, 20, 20],
          columns : [chartColumn2]
        },
        {
          margin : [5, 20, 5, 2],
          columns : [
            {text : 'Locationwise Movement Summary', alignment : 'left',bold : 'true', fontsize : 40}
          ]
        },
        {
          margin : [5, 2, 20, 20],
          columns : [secondTable]
        },
        {
          margin : [5, 20, 5, 2],
          columns : [
            {text : 'Porter - Hourly Idle Summary (in mins)', alignment : 'left',bold : 'true', fontsize : 40}
          ]
        },
        {
          margin : [5, 2, 20, 20],
          columns : [thirdTable]
        },
        {
          margin : [5, 20, 5, 2],
          columns : [
            {text : 'Porter Individual Performance', alignment : 'left',bold : 'true', fontsize : 40}
          ]
        },
        {
          margin : [5, 20, 20, 20],
          columns: [
            table
          ]
        },
      ];
      if(id == 'asset-move'){
        content[1]={text : 'ASSET REQUEST SUMMARY', alignment : 'center', bold : 'true', fontsize : 30}
      }
    }
    else if(id == 'porter-req-summary')
    {
      // chartColumn1[0].fit = [900,500];
      // chartColumn1[1].fit = [900,500];
      content =  [
        {text : this.nowFacility, alignment : 'center', bold : 'true', fontsize : 30},
        {text : 'PORTER REQUEST SUMMARY', alignment : 'center', bold : 'true', fontsize : 30},
        {
          margin : [5, 20, 20, 5],
          columns : [
            {text : 'Report Name :' + name.toUpperCase(), alignment : 'left'},
            {text : 'Generated On :' + this.datepipe.transform(new Date().getTime(), 'yyyy-MM-dd HH:mm:ss'), alignment : 'right'}
          ]
        },
        {
          margin : [5, 5, 20, 20],
          columns : [
          {text : 'Report Date :' + addInfo['fromDate'] + ' - ' +addInfo['toDate'], alignment : 'left'},]
        },
        PS_table,
        {
          margin : [0, 5, 0, 0],
          columns : [PS_table2]
        },
        {
          margin : [20, 20, 20, 20],
          columns : [chartColumn1[0]],
        },
        {
          margin : [20, 20, 20, 20],
          columns : [chartColumn1[1]],
        },
        {
          margin : [20, 20, 20, 20],
          columns : [chartColumn1[2]],
        },
        {
          margin : [20, 20, 20, 20],
          columns : [chartColumn1[3]],
        },
        {
          margin : [20, 20, 20, 20],
          columns : [chartColumn2[0]],
        },
        {
          margin : [5, 20, 5, 2],
          columns : [
            {text : 'Locationwise Movement Summary', alignment : 'left',bold : 'true', fontsize : 40}
          ]
        },
        {
          margin : [5, 2, 20, 20],
          columns : [secondTable]
        },
        // {
        //   margin : [5, 20, 5, 2],
        //   columns : [
        //     {text : 'Porter - Hourly Idle Summary (in mins)', alignment : 'left',bold : 'true', fontsize : 40}
        //   ]
        // },
        // {
        //   margin : [5, 2, 20, 20],
        //   columns : [thirdTable]
        // },
        {
          margin : [5, 20, 5, 2],
          columns : [
            {text : 'Datewise Summary', alignment : 'left',bold : 'true', fontsize : 40}
          ]
        },
        {
          margin : [5, 2, 20, 20],
          columns : [fourthTable]
        },
        {
          margin : [5, 20, 5, 2],
          columns : [
            {text : 'Porter Individual Performance', alignment : 'left',bold : 'true', fontsize : 40}
          ]
        },
        {
          margin : [5, 20, 20, 20],
          columns: [
            {
              stack: this.wrapTableColumns(table,9)}
          ]
        },
      ];
    } else if(id == 'nurse-call-sum'){
      content =  [
        {text : this.nowFacility, alignment : 'center', bold : 'true', fontsize : 30},
        {text : 'NURSECALL SUMMARY', alignment : 'center', bold : 'true', fontsize : 30},
        {
          margin : [5, 20, 20, 5],
          columns : [
            {text : 'Report Name :' + name.toUpperCase(), alignment : 'left'},
            {text : 'Generated On :' + this.datepipe.transform(new Date().getTime(), 'yyyy-MM-dd HH:mm:ss'), alignment : 'right'}
          ]
        },
        {
          margin : [5, 5, 20, 20],
          columns : [
          {text : 'Report Date :' + addInfo['fromDate'] + ' - ' +addInfo['toDate'], alignment : 'left'},]
        },
        PS_table,
        {columns : chartColumn1, },
        {columns : chartColumn2, },
      ]
    }else if(id == 'porter-daily'){
      content =  [
        {text : this.nowFacility, alignment : 'center', bold : 'true', fontsize : 30},
        {
          margin : [5, 20, 20, 5],
          columns : [
            {text : 'Report Name :' + name.toUpperCase(), alignment : 'left'},
            {text : 'Generated On :' + this.datepipe.transform(new Date().getTime(), 'yyyy-MM-dd HH:mm:ss'), alignment : 'right'}
          ]
        },
        {
          margin : [5, 5, 20, 20],
          columns : [{text : 'Report Date :' +selectedDate, alignment : 'left'},]
        },
        PS_table,
        {columns : chartColumn1, },
        {columns : chartColumn2, },
      ];
    } else if(id == 'porter-perf')
    {
      content =  [
        {text : this.nowFacility, alignment : 'center', bold : 'true', fontsize : 30},
        {text : 'PORTER PERFORMANCE SUMMARY', alignment : 'center', bold : 'true', fontsize : 30},
        {
          margin : [5, 20, 20, 5],
          columns : [
            {text : 'Report Name :' + name.toUpperCase(), alignment : 'left'},
            {text : 'Generated On :' + this.datepipe.transform(new Date().getTime(), 'yyyy-MM-dd HH:mm:ss'), alignment : 'right'}
          ]
        },
        {
          margin : [5, 5, 20, 20],
          columns : [{text : 'Report Date :' + addInfo['fromDate'] + ' - ' +selectedDate, alignment : 'left'},]
        },
        PS_table,
        {
          margin : [20,20,20,20],
          columns : [chartColumn1[0],chartColumn1[1]],
        },
        {
          margin : [20,20,20,20],
          columns : [chartColumn1[2]],
        },
        {
          margin : [20,20,20,20],
          columns : [chartColumn1[3]],
        },
        {
          margin : [20,20,20,20],
          columns : [chartColumn1[4]],
        },
        {
          margin : [20,20,20,20],
          columns : [chartColumn1[5]],
        },
        {
          margin : [20,20,20,20],
          columns : [chartColumn1[6]],
        },
        {
          margin : [5, 20, 20, 20],
          columns: [
            table
          ]
        },
      ];
    }
    // else if(id == 'asset-move')
    // {
    //   chartColumn1[0].fit = [400,400];
    //   chartColumn1[1].fit = [700,500];
    //   chartColumn1[2].fit = [900,500];
    //   // chartColumn2[0].fit=[900,500];
    //   content =  [
    //     {text : this.nowFacility, alignment : 'center', bold : 'true', fontsize : 30},
    //     {text : 'ASSET REQUEST SUMMARY', alignment : 'center', bold : 'true', fontsize : 30},
    //     {
    //       margin : [5,20,20,5],
    //       columns : [
    //         {text : 'Report Name :' + name.toUpperCase(), alignment : 'left'},
    //         {text : 'Generated On :' + this.datepipe.transform(new Date().getTime(), 'yyyy-MM-dd HH:mm:ss'), alignment : 'right'}
    //       ]
    //     },
    //     {
    //       margin : [5,5,20,20],
    //       text : 'Report Date :' + selectedDate, alignment : 'left'
    //     },
    //     PS_table,
    //     {
    //       margin : [20,20,20,20],
    //       columns : [chartColumn1[0]],
          
    //     },
    //     {
    //       margin : [20,20,20,20],
    //       columns : [chartColumn1[1]],
    //     },
    //     {
    //       margin : [20,20,20,20],
    //       columns : [chartColumn1[2]],
    //     },
    //     // {columns : [chartColumn2],
    //     // },
    //     {
    //       margin : [5,20,20,20],
    //       columns: [
    //         table   
    //       ]
    //     },
    //   ];
    // }
    else if(id == 'nurse-call')
    {
      
      content =  [
        {text : this.nowFacility, alignment : 'center', bold : 'true', fontsize : 30},
        {text : 'NURSE CALL REPORT', alignment : 'center', bold : 'true', fontsize : 30},
        {
          margin : [5,20,20,5],
          columns : [
            {text : 'Report Name :' + name.toUpperCase(), alignment : 'left'},
            {text : 'Generated On :' + this.datepipe.transform(new Date().getTime(), 'yyyy-MM-dd HH:mm:ss'), alignment : 'right'}
          ]
        },
        {
          margin : [5,5,20,20],
          text : 'Report Date :' + selectedDate, alignment : 'left'
        },
        PS_table,
        // {
        //   columns : [{text : ' ', alignment : 'center', bold : 'true', fontsize : 30}],
        // },
        // {
        //   columns : [{text : ' ', alignment : 'center', bold : 'true', fontsize : 30}],
        // },
        // {
        //   columns : [{text : ' ', alignment : 'center', bold : 'true', fontsize : 30}],
        // },
        // {
        //   columns : [{text : 'Nurse Call', alignment : 'center', bold : 'true', fontsize : 30}],
        // },
        // {
        //   columns : [{text : ' ', alignment : 'center', bold : 'true', fontsize : 30}],
        // },
        {
          columns : [chartColumn1[0]],
          alignment : 'left',
        },
        // {
        //   columns : [{text : ' ', alignment : 'center', bold : 'true', fontsize : 30}],
        // },
        // {
        //   columns : [{text : ' ', alignment : 'center', bold : 'true', fontsize : 30}],
        // },
        // {
        //   columns : [{text : ' ', alignment : 'center', bold : 'true', fontsize : 30}],
        // },
        // {
        //   columns : [{text : ' ', alignment : 'center', bold : 'true', fontsize : 30}],
        // },
        // {
        //   columns : [{text : ' ', alignment : 'center', bold : 'true', fontsize : 30}],
        // },
        // {
        //   columns : [{text : ' ', alignment : 'center', bold : 'true', fontsize : 30}],
        // },
        // {
        //   columns : [{text : ' ', alignment : 'center', bold : 'true', fontsize : 30}],
        // },
        // {
        //   columns : [{text : ' ', alignment : 'center', bold : 'true', fontsize : 30}],
        // },
        // {
        //   columns : [{text : ' ', alignment : 'center', bold : 'true', fontsize : 30}],
        // },
        // {
        //   columns : [{text : ' ', alignment : 'center', bold : 'true', fontsize : 30}],
        // },
        // {
        //   columns : [{text : ' ', alignment : 'center', bold : 'true', fontsize : 30}],
        // },
        // {
        //   columns : [{text : ' ', alignment : 'center', bold : 'true', fontsize : 30}],
        // },
        
        // {
        //   columns : [{text : 'Hourly Call', alignment : 'center', bold : 'true', fontsize : 30}],
        // },
        // {
        //   columns : [{text : ' ', alignment : 'center', bold : 'true', fontsize : 30}],
        // },
        {
          columns : [chartColumn1[1]],
          alignment : 'left',
        },
        {
          margin : [5,20,20,40],
          columns: [
            table   
          ]
        },
      ];
    } else if(name == 'audit_log')
    {
      content =  [
        {text : this.nowFacility, alignment : 'center', bold : 'true', fontsize : 30},
        {text : 'AUDIT LOG', alignment : 'center', bold : 'true', fontsize : 30},
        {
          margin : [5,20,20,5],
          columns : [
            {text : 'Report Name :' + name.toUpperCase(), alignment : 'left'},
            {text : 'Generated On :' + this.datepipe.transform(new Date().getTime(), 'yyyy-MM-dd HH:mm:ss'), alignment : 'right'}
          ]
        },
        {
          margin : [5,5,20,20],
          text : 'Report Date :' + selectedDate, alignment : 'left'
        },
        PS_table,
        {
          margin : [5,20,20,5],
          columns : [chartColumn1[0],chartColumn1[1]],
        },
        {
          margin : [5,20,20,20],
          columns: [
            table , secondTable  
          ]
        },
        
      ];
    } else if(name == 'error_log')
    {
      content =  [
        {text : this.nowFacility, alignment : 'center', bold : 'true', fontsize : 30},
        {text : 'ERROR LOG', alignment : 'center', bold : 'true', fontsize : 30},
        {
          margin : [5,20,20,5],
          columns : [
            {text : 'Report Name :' + name.toUpperCase(), alignment : 'left'},
            {text : 'Generated On :' + this.datepipe.transform(new Date().getTime(), 'yyyy-MM-dd HH:mm:ss'), alignment : 'right'}
          ]
        },
        {
          margin : [5,5,20,20],
          text : 'Report Date :' + selectedDate, alignment : 'left'
        },
        PS_table,
        {
          margin : [5,20,20,5],
          columns : [chartColumn1[0],chartColumn1[1]],
        },
        {
          margin : [5,20,20,20],
          columns: [
            table , secondTable
          ]
        },

      ];
    }
    else if(id == 'patient-status-op'){
	  content =  [
        {text : this.nowFacility, alignment : 'center', bold : 'true', fontsize : 30},
        {text : 'OUT PATIENTS REPORT', alignment : 'center', bold : 'true', fontsize : 30},
        {
          margin : [5, 20, 20, 5],
          columns : [
	    {text : 'Report Name :' + name.toUpperCase() , alignment : 'left'},
            {text : 'Generated On :' + this.datepipe.transform(new Date().getTime(), 'yyyy-MM-dd HH:mm:ss'), alignment : 'right'}
          ]
        },
        {
          margin : [5, 5, 20, 20],
          text : 'Report Date   :' + selectedDate, alignment : 'left'
        },
		PS_table,
        {columns : [chartColumn1[0],chartColumn1[1],chartColumn1[2]], },
        {columns : [chartColumn2[1],chartColumn2[0]],},
        {columns : [chartColumn3[0]], },
        {columns : [chartColumn3[1]], },
        {
          margin : [5, 20, 20,20],
          columns: [
            table,secondTable
          ]
        }
      ];
    } 
    else if(id == "battery-summary" || id == 'staff-battery-summary'){
      content= [
        {text : this.nowFacility, alignment : 'center', bold : 'true', fontsize : 30},
        {
          margin : [5, 20, 20, 5],
          columns : [
            {text : 'Report Name :' + name.toUpperCase(), alignment : 'left', fontsize : 30},
            {text : 'Generated On :' + this.datepipe.transform(new Date().getTime(), 'yyyy-MM-dd HH:mm:ss'), alignment : 'right', fontsize : 30}
          ]
        },
        {
          margin : [5, 5, 20, 20],
          text : 'Report Date :' + selectedDate, alignment : 'left', fontsize : 30
        },
		    PS_table,
        {columns : chartColumn1, },
        {columns : chartColumn2, },
        {columns : chartColumn3, },
        {
          margin : [100, 5, 20, 20],
          columns : [{text : 'Report Details on battery status', alignment : 'left', fontsize : 50}] },
        {
          margin : [100, 5, 20, 20],
          columns: [table],
          alignment : 'left'
        }
      ];
    }else if(id == "env-moni-rep"){
      columns = Object.keys(json['Table'][0]);
      table = this.table(json['Table'],columns);
      content= [
        {text : this.nowFacility, alignment : 'center', bold : 'true', fontsize : 30},
        {
          margin : [5, 20, 20, 5],
          columns : [
            {text : 'Report Name :' + name.toUpperCase(), alignment : 'left', fontsize : 30},
            {text : 'Generated On :' + this.datepipe.transform(new Date().getTime(), 'yyyy-MM-dd HH:mm:ss'), alignment : 'right', fontsize : 30}
          ]
        },
        {
          margin : [5, 5, 20, 20],
          text : 'Report Date :' + selectedDate, alignment : 'left', fontsize : 30
        },
		PS_table,
        {columns : chartColumn1, },
        {columns : chartColumn2, },
        {columns : chartColumn3, },
        {
          margin : [100, 5, 20, 20],
          columns : [{text : 'Report Details on Temperature', alignment : 'left', fontsize : 50}] },
        {
          margin : [100, 5, 20, 20],
          columns: [table],
          alignment : 'left'
        }
      ];
    }else if(id == "asset-utiby-byid"){
      // columns = Object.keys(json['Table'][0]);
      // table = this.table(json['Table'],columns);
      content= [
        {text : this.nowFacility, alignment : 'center', bold : 'true', fontsize : 30},
        {
          margin : [5, 20, 20, 5],
          columns : [
            {text : 'Report Name :' + name.toUpperCase(), alignment : 'left', fontsize : 30},
            {text : 'Generated On :' + this.datepipe.transform(new Date().getTime(), 'yyyy-MM-dd HH:mm:ss'), alignment : 'right', fontsize : 30}
          ]
        },
        {
          margin : [5, 5, 20, 20],
          text : 'Report Date :' + selectedDate, alignment : 'left', fontsize : 30
        },
		PS_table,
        {columns : chartColumn1, },
        {columns : chartColumn2, },
        {columns : chartColumn3, },
      ];
    }
    else if(id == 'coaster-details'){
      columns = Object.keys(json[0]);
      table = this.table(json,columns);
            content=  [
              {text : this.nowFacility, alignment : 'center', bold : 'true', fontsize : 30},
              {text : 'COASTER RETURN REPORT DETAILS', alignment : 'center', bold : 'true', fontsize : 30},
              {
                margin : [5, 20, 20, 5],
                columns : [
                  {text : 'Report Name :' + name.toUpperCase(), alignment : 'left'},
                  {text : 'Generated On :' + this.datepipe.transform(new Date().getTime(), 'yyyy-MM-dd HH:mm:ss'), alignment : 'right'}
                ]
              },

              {
                margin : [5, 5, 20, 20],
                text : 'Report Date :' + selectedDate, alignment : 'left'
              },
          PS_table,
              {columns : chartColumn1, },
              {columns : chartColumn2, },
              {columns : chartColumn3, },
              {
                margin : [5, 20, 20, 20],
                columns: [table]
              }
            ];
    } else if(id == 'OT-Rep'){
            columns=Object.keys(json['otDetail'][0]);
            console.log(columns)
            table = this.table(json['otDetail'],columns);
            content=  [
              {text : this.nowFacility, alignment : 'center', bold : 'true', fontsize : 30},
              {text : 'OT COMPLEX UTILIZATION REPORT', alignment : 'center', bold : 'true', fontsize : 30},
              {
                margin : [5, 20, 20, 5],
                columns : [
                  {text : 'Report Name :' + name.toUpperCase(), alignment : 'left'},
                  {text : 'Generated On :' + this.datepipe.transform(new Date().getTime(), 'yyyy-MM-dd HH:mm:ss'), alignment : 'right'}
                ]
              },
              {
                margin : [5, 5, 20, 20],
                text : 'Report Date :' + selectedDate, alignment : 'left'
              },
          PS_table,
              {columns : chartColumn1, },
              {columns : chartColumn2, },
              {columns : chartColumn3, },
              {
                margin : [5, 20, 20, 20],
                columns: [table]
              }
            ];
    } else if(id == 'maintenancerep'){
      content=  [
        {text : this.nowFacility, alignment : 'center', bold : 'true', fontsize : 30},
        {text : 'MAINTENANCE REPORT', alignment : 'center', bold : 'true', fontsize : 30},
        {
          margin : [5, 20, 20, 5],
          columns : [
            {text : 'Report Name :' + name.toUpperCase(), alignment : 'left'},
            {text : 'Generated On :' + this.datepipe.transform(new Date().getTime(), 'yyyy-MM-dd HH:mm:ss'), alignment : 'right'}
          ]
        },
        {
          margin : [5, 5, 20, 5],
          text : 'Report Date :' + selectedDate, alignment : 'left'
        },
        {
          margin : [5, 5, 20, 20],
          text : 'Current Summary', alignment : 'left'
        },
		PS_table,
        {
          margin : [0, 20, 0, 0],
          columns : [chartColumn1[0]], },
        {columns : [chartColumn1[1]], },

        {
          margin : [5, 20, 20, 20],
          columns: [
            table,secondTable
          ]
        }
      ];
    } else if(id == 'asset-misplaced' || id == 'asset-missing' || id == 'asset-utilz'){
      content=  [
        {text : this.nowFacility, alignment : 'center', bold : 'true', fontsize : 30},
        {text : 'ASSET REPORT', alignment : 'center', bold : 'true', fontsize : 30},
        {
          margin : [5, 20, 20, 5],
          columns : [
            {text : 'Report Name :' + name.toUpperCase(), alignment : 'left'},
            {text : 'Generated On :' + this.datepipe.transform(new Date().getTime(), 'yyyy-MM-dd HH:mm:ss'), alignment : 'right'}
          ]
        },
        {
          margin : [5, 5, 20, 20],
          text : 'Report Date :' + selectedDate, alignment : 'left'
        },
		PS_table,
        {columns : [chartColumn1[0]], },
        {columns : [chartColumn1[1]], },

        {
          margin : [5, 20, 20, 20],
          columns: [
            table
          ]
        }
      ];
    } else if(id == 'asset-summary'){
      content=  [
        {text : this.nowFacility, alignment : 'center', bold : 'true', fontsize : 30},
        {text : 'ASSET REPORT', alignment : 'center', bold : 'true', fontsize : 30},
        {
          margin : [5, 20, 20, 5],
          columns : [
            {text : 'Report Name :' + name.toUpperCase(), alignment : 'left'},
            {text : 'Generated On :' + this.datepipe.transform(new Date().getTime(), 'yyyy-MM-dd HH:mm:ss'), alignment : 'right'}
          ]
        },
        {
          margin : [5, 5, 20, 20],
          columns : [{text : 'Report Date :' + addInfo['fromDate'] + ' - ' +selectedDate, alignment : 'left'},]
        },
		PS_table,
        {columns : [chartColumn1[0]], },
        {columns : [chartColumn1[1]], },
        {columns : [chartColumn1[2]], },
        {columns : [chartColumn1[3]], }
      ];
      if(json['missingTable'].length>0){
        content.push({
          margin : [5, 20, 5, 2],
          columns : [
            {text : 'Asset Missing', alignment : 'left',bold : 'true', fontsize : 40}
          ]
        },
        {
          margin : [5, 20, 20, 20],
          columns: [
            table
          ]
        })
      }
      if(json['misplacedTable'].length>0){
        content.push({
          margin : [5, 20, 5, 2],
          columns : [
            {text : 'Asset Misplaced', alignment : 'left',bold : 'true', fontsize : 40}
          ]
        },
        {
          margin : [5, 20, 20, 20],
          columns: [
            secondTable
          ]
        })
      }
      if(json['transferTable'].length>0){
        content.push({
          margin : [5, 20, 5, 2],
          columns : [
            {text : 'Asset Transferred', alignment : 'left',bold : 'true', fontsize : 40}
          ]
        },
        {
          margin : [5, 20, 20, 20],
          columns: [
            thirdTable
          ]
        })
      } 
      if(json['geofenceTable'].length>0){
        content.push({
          margin : [5, 20, 5, 2],
          columns : [
            {text : 'Geofence Alerts', alignment : 'left',bold : 'true', fontsize : 40}
          ]
        },
        {
          margin : [5, 20, 20, 20],
          columns: [
            fourthTable
          ]
        })
      } 
    } else if(id == 'patient-status'){
      content=  [
        {text : this.nowFacility, alignment : 'center', bold : 'true', fontsize : 30},
        {text : 'PATIENT SUMMARY', alignment : 'center', bold : 'true', fontsize : 30},
        {
          margin : [5, 20, 20, 5],
          columns : [
            {text : 'Report Name :' + name.toUpperCase(), alignment : 'left'},
            {text : 'Generated On :' + this.datepipe.transform(new Date().getTime(), 'yyyy-MM-dd HH:mm:ss'), alignment : 'right'}
          ]
        },
        {
          margin : [5, 5, 20, 20],
          text : 'Report Date :' + selectedDate, alignment : 'left'
        },
        PS_table,
        { margin : [20, 20, 20, 20], columns : chartColumn1,},
        { margin : [20, 20, 20, 20], columns : chartColumn2,},
        { margin : [20, 20, 20, 20], columns : chartColumn3},
        {
          margin : [5, 20, 20, 20],
          columns: [
            table
          ]
        },
      ];
    } else if(id == 'OT-utilz') {
      PS_table = {
        style : 'tableExample',
        table : {
          headerRows : 1,
          widths : [100,100,100,100,100,100,100,100],
          body : [
            ['Total Surgeries','Total OT Utilization','Total PreOP Time','Total PostOp Time','Total Surgeons','Max Utilized OT (by hr)','Min Utilized OT (by hr)','Most Utilized OT (by surgery)'],
            [                
              { text : json['Total Surgeries'], style : {alignment : 'center', fontsize : 20, }},
              { text : json['Total OT Utilization'], style : {alignment : 'center', fontsize : 20, }},
              { text : json['Total PreOP Time'], style : {alignment : 'center', fontsize : 20, }},
              { text : json['Total PostOp Time'], style : {alignment : 'center', fontsize : 20, }},
              { text : json['Total Surgeons'], style : {alignment : 'center', fontsize : 20, }},
              { text : json['Max Utilized OT (by hr)'], style : {alignment : 'center', fontsize : 20, }},
              { text : json['Min Utilized OT (by hr)'], style : {alignment : 'center', fontsize : 20, }},
              { text : json['Most Utilized OT (by surgery)'], style : {alignment : 'center', fontsize : 20, }},
            ]
          ]
        }
      }
      content=  [
        {text : this.nowFacility, alignment : 'center', bold : 'true', fontsize : 30},
        {text : 'OT Location Utilization Report', alignment : 'center', bold : 'true', fontsize : 30},
        {
          margin : [5, 20, 20, 5],
          columns : [
            {text : 'Report Name :' + name.toUpperCase(), alignment : 'left'},
            {text : 'Generated On :' + this.datepipe.transform(new Date().getTime(), 'yyyy-MM-dd HH:mm:ss'), alignment : 'right'}
          ]
        },
        {
          margin : [5, 5, 20, 20],
          columns : [
            {text : 'Report Date :' + selectedDate + ' - ' +addInfo['toDate'], alignment : 'left'},
          ]
        },
        PS_table,
        { margin : [20, 20, 20, 20], columns : chartColumn1,},
        { margin : [20, 20, 20, 20], columns : chartColumn2,},
        { margin : [20, 20, 20, 20], columns : chartColumn3},
        { margin : [20, 20, 20, 20], columns : chartColumn4},
        { margin : [20, 20, 20, 20], columns : chartColumn5},
      ];
    } else if(id == 'ER-utilz') {
      PS_table = {
        style : 'tableExample',
        table : {
          headerRows : 1,
          widths : [100,100,100,100,100,100,100],
          body : [
            ['Total Patients','Total ER Utilization','Total Triage Time','Total Radiology Time','Max Utilized ER (by hr)','Min Utilized ER (by hr)','Most Utilized ER (by count)'],
            [                
              { text : json['Total Patients'], style : {alignment : 'center', fontsize : 20, }},
              { text : json['Total ER Utilization'], style : {alignment : 'center', fontsize : 20, }},
              { text : json['Total Triage Time'], style : {alignment : 'center', fontsize : 20, }},
              { text : json['Total Radiology Time'], style : {alignment : 'center', fontsize : 20, }},
              { text : json['Max Utilized ER (by hr)'], style : {alignment : 'center', fontsize : 20, }},
              { text : json['Min Utilized ER (by hr)'], style : {alignment : 'center', fontsize : 20, }},
              { text : json['Most Utilized ER (by count)'], style : {alignment : 'center', fontsize : 20, }},
            ]
          ]
        }
      }
      content=  [
        {text : this.nowFacility, alignment : 'center', bold : 'true', fontsize : 30},
        {text : 'ER Location Utilization Report', alignment : 'center', bold : 'true', fontsize : 30},
        {
          margin : [5, 20, 20, 5],
          columns : [
            {text : 'Report Name :' + name.toUpperCase(), alignment : 'left'},
            {text : 'Generated On :' + this.datepipe.transform(new Date().getTime(), 'yyyy-MM-dd HH:mm:ss'), alignment : 'right'}
          ]
        },
        {
          margin : [5, 5, 20, 20],
          columns : [
            {text : 'Report Date :' + selectedDate + ' - ' +addInfo['toDate'], alignment : 'left'},
          ]
        },
        PS_table,
        { margin : [20, 20, 20, 20], columns : chartColumn1,},
        { margin : [20, 20, 20, 20], columns : chartColumn2,},
        { margin : [20, 20, 20, 20], columns : chartColumn3},
        { margin : [20, 20, 20, 20], columns : chartColumn4},
        { margin : [20, 20, 20, 20], columns : chartColumn5},
      ];
    } else if(id == 'OT-wait') {
      PS_table = {
        style : 'tableExample',
        table : {
          headerRows : 1,
          widths : [200,200,200,200,200],
          body : [
            ['Total Surgeries','Total OT Waittime','Total PreOP Waittime','Total PostOp Waittime'],
            [                
              { text : json['Total Surgeries'], style : {alignment : 'center', fontsize : 20, }},
              { text : json['Total OT Waittime'], style : {alignment : 'center', fontsize : 20, }},
              { text : json['Total PreOP Waittime'], style : {alignment : 'center', fontsize : 20, }},
              { text : json['Total PostOp Waittime'], style : {alignment : 'center', fontsize : 20, }},
            ]
          ]
        }
      }
      content=  [
        {text : this.nowFacility, alignment : 'center', bold : 'true', fontsize : 30},
        {text : 'OT Waittime Report', alignment : 'center', bold : 'true', fontsize : 30},
        {
          margin : [5, 20, 20, 5],
          columns : [
            {text : 'Report Name :' + name.toUpperCase(), alignment : 'left'},
            {text : 'Generated On :' + this.datepipe.transform(new Date().getTime(), 'yyyy-MM-dd HH:mm:ss'), alignment : 'right'}
          ]
        },
        {
          margin : [5, 5, 20, 20],
          columns : [
          {text : 'Report Date :' + selectedDate + ' - ' +addInfo['toDate'], alignment : 'left'},]
        },
        PS_table,
        { margin : [20, 20, 20, 20], columns : chartColumn1,},
        { margin : [20, 20, 20, 20], columns : chartColumn2,},
      ];
    } else if(id == 'ER-wait') {
      PS_table = {
        style : 'tableExample',
        table : {
          headerRows : 1,
          widths : [200,200,200,200],
          body : [
            ['Total Patients','Total ER Waittime','Total Triage Waittime','Total Radiology Waittime'],
            [                
              { text : json['Total Patients'], style : {alignment : 'center', fontsize : 20, }},
              { text : json['Total ER Waittime'], style : {alignment : 'center', fontsize : 20, }},
              { text : json['Total Triage Waittime'], style : {alignment : 'center', fontsize : 20, }},
              { text : json['Total Radiology Waittime'], style : {alignment : 'center', fontsize : 20, }},
            ]
          ]
        }
      }
      content=  [
        {text : this.nowFacility, alignment : 'center', bold : 'true', fontsize : 30},
        {text : 'ER Waittime Report', alignment : 'center', bold : 'true', fontsize : 30},
        {
          margin : [5, 20, 20, 5],
          columns : [
            {text : 'Report Name :' + name.toUpperCase(), alignment : 'left'},
            {text : 'Generated On :' + this.datepipe.transform(new Date().getTime(), 'yyyy-MM-dd HH:mm:ss'), alignment : 'right'}
          ]
        },
        {
          margin : [5, 5, 20, 20],
          columns : [
          {text : 'Report Date :' + selectedDate + ' - ' +addInfo['toDate'], alignment : 'left'},]
        },
        PS_table,
        { margin : [20, 20, 20, 20], columns : chartColumn1,}
      ];
    } else if(id == 'vitals-infant' || id == 'vitals-chart'){
      content= [];
      if(id == 'vitals-infant'){
        content.push({text : 'INFANT VITALS('+addInfo['refType'].toUpperCase()+') CHART', alignment : 'center', bold : 'true', fontsize : 30})
        content.push({
              margin : [5, 20, 20, 5],
              columns : [
                {text : 'Report Name :' + name.toUpperCase(), alignment : 'left'},
                {text : 'Generated On :' + this.datepipe.transform(new Date().getTime(), 'yyyy-MM-dd HH:mm:ss'), alignment : 'right'}
              ]
        })
        content.push({margin : [5, 5, 134, 5],
             columns : [
               {text : 'Report Date :' + selectedDate + ' - ' +addInfo['toDate'], alignment : 'left'},
               {text : 'Unit :' + addInfo['unit'], alignment : 'right'}
             ]
        })
        content.push({text : 'Patient Name :' + addInfo['patName'] + ' (' + addInfo['uhid'] + ')', alignment : 'left', margin : [5, 5, 20, 5]})
        content.push(PS_table)
        content.push({ margin : [20, 20, 20, 20], columns : chartColumn1,})
        content.push({text : addInfo['refType']+' Reference - Low: '+ addInfo['low'] + ' and High: '+ addInfo['high'], alignment : 'center'})
      } else {
        if(addInfo['refType'] === ''){
          content.push({text : 'VITALS CHART', alignment : 'center', bold : 'true', fontsize : 30})
        } else{
          content.push({text : 'VITALS('+addInfo['refType'].toUpperCase()+') CHART', alignment : 'center', bold : 'true', fontsize : 30})
        }
        content.push({
          margin : [5, 20, 20, 5],
          columns : [
            {text : 'Report Name :' + name.toUpperCase(), alignment : 'left'},
            {text : 'Generated On :' + this.datepipe.transform(new Date().getTime(), 'yyyy-MM-dd HH:mm:ss'), alignment : 'right'}
          ]
        })
        content.push({margin : [5, 5, 134, 5],
            columns : [
              {text : 'Report Date :' + selectedDate + ' - ' +addInfo['toDate'], alignment : 'left'}
            ]
        })
        content.push({text : 'Patient Name :' + addInfo['patName'] + ' (' + addInfo['uhid'] + ')', alignment : 'left', margin : [5, 5, 20, 5]})
        content.push(PS_table)
        content.push({ margin : [20, 20, 20, 20], columns : chartColumn1,})
        if(addInfo['refType'] !== ''){
          content.push({text : addInfo['refType']+' Reference - Low: '+ addInfo['low'] + ' and High: '+ addInfo['high'], alignment : 'center'})
        }

      }
      // content=  [
      //   {text : 'INFANT VITALS('+addInfo['refType'].toUpperCase()+') CHART', alignment : 'center', bold : 'true', fontsize : 30},
      //   {
      //     margin : [5, 20, 20, 5],
      //     columns : [
      //       {text : 'Report Name :' + name.toUpperCase(), alignment : 'left'},
      //       {text : 'Generated On :' + this.datepipe.transform(new Date().getTime(), 'yyyy-MM-dd HH:mm:ss'), alignment : 'right'}
      //     ]
      //   },
      //   {margin : [5, 5, 134, 5],
      //    columns : [
      //      {text : 'Report Date :' + selectedDate + ' - ' +addInfo['toDate'], alignment : 'left'},
      //      {text : 'Unit :' + addInfo['unit'], alignment : 'right'}
      //    ]
      //   },
      //   {text : 'Patient Name :' + addInfo['patName'] + ' (' + addInfo['uhid'] + ')', alignment : 'left', margin : [5, 5, 20, 5]},
      //   PS_table,
      //   { margin : [20, 20, 20, 20], columns : chartColumn1,},
      //   {text : addInfo['refType']+' Reference - Low: '+ addInfo['low'] + ' and High: '+ addInfo['high'], alignment : 'center'},
      // ];
    } else if(id == 'pat-routin-sumary'){
      content=  [
        {text : this.nowFacility, alignment : 'center', bold : 'true', fontsize : 30},
        {text : 'PATIENT ROUTINE SUMMARY', alignment : 'center', bold : 'true', fontsize : 30},
        {
          margin : [5, 20, 20, 5],
          columns : [
            {text : 'Report Name :' + name.toUpperCase(), alignment : 'left'},
            {text : 'Generated On :' + this.datepipe.transform(new Date().getTime(), 'yyyy-MM-dd HH:mm:ss'), alignment : 'right'}
          ]
        },
        {
          margin : [5, 5, 20, 20],
          columns : [
          {text : 'Report Date :' + addInfo['fromDate'] + ' - ' +addInfo['toDate'], alignment : 'left'},]
        },
        PS_table,
        {
          margin : [20, 20, 20, 20],
          columns : [chartColumn1[0]],
        },
        {
          margin : [5, 20, 5, 2],
          columns : [
            {text : 'Categorywise Summary', alignment : 'left',bold : 'true', fontsize : 40}
          ]
        },
        {
          margin : [5, 2, 20, 20],
          columns : [table]
        },
      ];
    } else if(id == 'stf-routin-sumary'){
      content=  [
        {text : this.nowFacility, alignment : 'center', bold : 'true', fontsize : 30},
        {text : 'STAFF ROUTINE SUMMARY', alignment : 'center', bold : 'true', fontsize : 30},
        {
          margin : [5, 20, 20, 5],
          columns : [
            {text : 'Report Name :' + name.toUpperCase(), alignment : 'left'},
            {text : 'Generated On :' + this.datepipe.transform(new Date().getTime(), 'yyyy-MM-dd HH:mm:ss'), alignment : 'right'}
          ]
        },
        {
          margin : [5, 5, 20, 20],
          columns : [
          {text : 'Report Date :' + addInfo['fromDate'] + ' - ' +addInfo['toDate'], alignment : 'left'},]
        },
        PS_table,
        {
          margin : [20, 20, 20, 20],
          columns : [chartColumn1[0]],
        },
        {
          margin : [5, 20, 5, 2],
          columns : [
            {text : 'Categorywise Summary', alignment : 'left',bold : 'true', fontsize : 40}
          ]
        },
        {
          margin : [5, 2, 20, 20],
          columns : [table]
        },
      ];
    }else{
      content= [];
      // if(id == 'vitals-chart'){
      //   content.push({text : 'VITALS REPORT', alignment : 'center', bold : 'true', fontsize : 30})
      // }else {
      //   content.push({text : 'CONTACT TRACING', alignment : 'center', bold : 'true', fontsize : 30})
      // }
      content.push(
        {text : this.nowFacility, alignment : 'center', bold : 'true', fontsize : 30},
        // {text : 'CONTACT TRACING', alignment : 'center', bold : 'true', fontsize : 30},
        {
          margin : [5, 20, 20, 5],
          columns : [
            {text : 'Report Name :' + name.toUpperCase(), alignment : 'left'},
            {text : 'Generated On :' + this.datepipe.transform(new Date().getTime(), 'yyyy-MM-dd HH:mm:ss'), alignment : 'right'}
          ]
        })
        if(id == 'porter-perf-trend' || id == 'sensor-water-leak'){
          content.push({
            margin : [5, 5, 20, 20],
            text : 'Report Date :' + addInfo['fromDate'] + ' - ' +addInfo['toDate'], alignment : 'left'
          })
        } else{
          content.push({
            margin : [5, 5, 20, 20],
            text : 'Report Date :' + selectedDate, alignment : 'left'
          })
        }
		    content.push(PS_table)
        content.push({columns : chartColumn1, })
        content.push({columns : chartColumn2, })
        content.push({
          margin : [5, 20, 20, 20],
          columns: [
            table
          ]
        })
        content.push({
          margin : [5, 20, 20, 20],
          columns: [
            secondTable
          ]
        })
    }
    let documentDefinition = {
      pageSize : pageSize,
      footer : footer,
      header : header,
      content : content
    };
    return documentDefinition;
  }

  wrapTableColumns(originalTable, maxColsPerRow) {
    maxColsPerRow = maxColsPerRow - 2;
    const body = originalTable.table.body;
    const headers = body[0]; // First row (Header)
    const dataRows = body.slice(1); // Remaining rows

    let fixedColumns = headers.slice(0, 2); // First two columns (static)
    let fixedData = dataRows.map(row => row.slice(0, 2)); // Extract first two columns for all rows
    let tableChunks = [];
    for (let i = 0; i < headers.length; i += maxColsPerRow) {
      let slicedHeaders=[];
      let slicedData = [];
        if(i==0){
          slicedHeaders = headers.slice(i, i + maxColsPerRow);
          slicedData = dataRows.map(row => row.slice(i, i + maxColsPerRow));
        }else{
          slicedHeaders = [...fixedColumns,...headers.slice(i, i + maxColsPerRow)];
          slicedData = dataRows.map(row => [ ...row.slice(0, 2), ...row.slice(i, i + maxColsPerRow)]);
        }

        tableChunks.push({
            table: {
                headerRows: 1,
                widths: new Array(slicedHeaders.length).fill('*'), // Auto-adjust widths
                body: [slicedHeaders, ...slicedData]
            },
            // layout: 'lightHorizontalLines', // Use borders if needed
            margin: [0, i === 0 ? 0 : 10, 0, 0] // Adds spacing between tables
        });
    }

    return tableChunks;
}

  public async exportAsPdfFile(json: any[], columns: any[], name: string, selectedDate: string, id: string, chartData: any, addInfo?: any) {
    let documentDefinition = {};
    documentDefinition = {
      pageSize :  (await this.setDocumentDefinition(json, columns, name, selectedDate, id, chartData, addInfo)).pageSize,
      pageOrientation : 'potrait',
       defaultStyle: {
         font: 'THSarabunNew',
          fontSize: 20, 
          bold : true
       },
      pageMargins : [50, 80, 50, 80],
      footer:  (await this.setDocumentDefinition(json, columns, name, selectedDate, id, chartData, addInfo)).footer,
      header:  (await this.setDocumentDefinition(json, columns, name, selectedDate, id, chartData, addInfo)).header,
      content:  (await this.setDocumentDefinition(json, columns, name, selectedDate, id, chartData, addInfo)).content,
    };
    if(id != "battery-summary" && selectedDate!=null){
       pdfMake.createPdf(documentDefinition).download(name + '_' + selectedDate + '.pdf');
    }
    else{
       pdfMake.createPdf(documentDefinition).download(name + ':' + this.datepipe.transform(new Date().getTime(), 'dd-MMM-yyyy HH:mm:ss') + '.pdf');
    }
  }
}
