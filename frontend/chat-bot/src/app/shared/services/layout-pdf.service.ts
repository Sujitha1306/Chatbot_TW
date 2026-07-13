import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
//  import * as pdfFonts from "pdfmake/build/vfs_fonts.js"; // <-- vfs_fonts has to be imported before pdfmake
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { HospitalService } from './hospital.service';
pdfMake.vfs = pdfFonts.pdfMake.vfs;
@Injectable({
    providedIn: 'root'
})
export class LayoutPdfService{
    public imageData: any = '/assets/Alert/common_icons/new-logo.png';
    public nowFacility: string;
    constructor(public datepipe: DatePipe,private readonly hospitalService: HospitalService) {
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
    getBase64ImageFromImage(chartData) {
        let canvas = chartData
        let dataURL = canvas.toDataURL('image/png', 1);
        // console.log("dataURL:",dataURL);
        return dataURL;
    }
    // getDomtoImage(chartData){
    //   let domImg = domtoimage.toPng(chartData);
    //   return domImg;
    // }
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
    private buildTableBody(data, columns) {
      let body = [];
      const headerRow = columns.map(column => {
        return { text: column, style: 'header' };
      });
    
      body.push(headerRow);
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
    getPdfContent(chartImage,headerName,tableData,tableName){
      let content = [];
      let chartColumn1: Array<any> = [];
      content.push({text : this.nowFacility, alignment : 'center', bold : 'true', fontsize : 60});
      content.push();
      content.push({text : headerName, alignment : 'center', bold : 'true', fontsize : 50, margin: [5, 6]});
      for(let i=0;i<chartImage.length;i++){
        chartColumn1.push({image : this.getBase64ImageFromImage(chartImage[i]), fit : [250, 250], alignment: 'left',
        margin : [10, 15, 10, 50]});
        i++;
        if(i<chartImage.length){
          chartColumn1.push({image : this.getBase64ImageFromImage(chartImage[i]), fit : [250, 250], alignment: 'right',
          margin : [10, 15, 10, 50]});
        }
        content.push({
          columns : chartColumn1 
        });
        chartColumn1 = [];
      }
      if (tableData.length && tableName.length) {
        for(let i=0;i<tableData.length;i++){
          let widthList = [];
          let col = Object.keys(tableData[i][0]);
          widthList = Array(col.length).fill('auto');
          content.push({ text: tableName[i],bold : 'true'});
          content.push({
            margin: [10, 10],
            table: {
              headerRows: 1,
              widths: widthList,
              body: this.buildTableBody(tableData[i], col)
            }
          });
        }
      } 
      return content;
    }

    public async pdfCreate(pdfData){
        let chartImage = pdfData['chartImage'];
        let headerName = pdfData['headerName'];
        let tableData = pdfData['tableData'];
        let tableName = pdfData['tableName'];
        let pageSize = {
            width : 1200,
            height : 800,
          }
        const styles = {
          header: {
            bold: true
          }
        };
        let header = {
            margin: [50, 20, 20, 5],
            height : 80,
            columns : [
                {image : await this.getBase64ImageFromURL(this.imageData),fit : [150, 75], alignment : 'left'},
            ]
        };
        let content = [];
        content = this.getPdfContent(chartImage,headerName,tableData,tableName);
        // let documentDefinition = {};
        let documentDefinition = {
        pageSize : 'A4',
        pageOrientation : 'potrait',
        pageMargins : [50, 80, 50, 80],
        header: header,
        content: content,
        styles: styles
        };
         pdfMake.createPdf(documentDefinition).download(pdfData['pdfFileName']+'_'+pdfData['fromDate']+'_'+pdfData['toDate']+ '.pdf');
    }
}