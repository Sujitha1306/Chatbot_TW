import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
//  import * as pdfFonts from "pdfmake/build/vfs_fonts.js"; // <-- vfs_fonts has to be imported before pdfmake
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { HospitalService } from './hospital.service';
import { ConfigurationService } from './configuration.service';
import { environment } from '../../../environments/environment';
pdfMake.vfs = pdfFonts.pdfMake.vfs;
@Injectable({
    providedIn: 'root'
})
export class HazmatPdfService{
    public imageData: any = '/assets/Alert/common_icons/new-logo.png';
    public nowFacility: string;
    constructor(public datepipe: DatePipe,private readonly hospitalService: HospitalService,public configurationService:ConfigurationService) {
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

  drawCheckbox(checked) {
    const symbolSize = 10; 
    const checkbox = {
      canvas: [
        {
          type: 'rect',
          x: 0,
          y: 0,
          w: symbolSize,
          h: symbolSize,
          r: 2,
          lineWidth: 1,
          lineColor: '#000',
          color: checked ? '#000' : '#fff'
        }
      ],
      width: symbolSize + 5 
    };
    return checkbox;
  }
  drawCheckboxImage(checked) {
    return {
      image: checked ? 'check_box' : 'check_box_outline_blank',
      width: 10,
      height: 10,
      margin: [0, 5]
    };
  }

  async generateCustomCheckboxes(checkboxData, id) {
    try {
      checkboxData = checkboxData.map(checkbox => ({ ...checkbox, checked: false }));
      if(id){
        const res = await this.configurationService.getEntityForm(id).toPromise();
        if (res.statusCode === 1 && res.results.length > 0) {
          let formValue = res.results[0]['formValue'];
          checkboxData.forEach(item => {
            if (formValue.hasOwnProperty(item.name) && formValue[item.name]) {
              item.checked = formValue[item.name];
            }
          });
          const checkboxes = checkboxData.map(item => ({
            columns: [
              { width: 'auto', stack: [this.drawCheckbox(item.checked)] },
              { width: '*', text: item.labelName, margin: [5, 0, 0, 5] }
            ]
          }));
          return checkboxes;
        } else {
          const checkboxes = checkboxData.map(item => ({
            columns: [
              { width: 'auto', stack: [this.drawCheckbox(item.checked)] },
              { width: '*', text: item.labelName, margin: [5, 0, 0, 5] }
            ]
          }));
          return checkboxes;
        }
      } else{
        const checkboxes = checkboxData.map(item => ({
          columns: [
            { width: 'auto', stack: [this.drawCheckbox(item.checked)] },
            { width: '*', text: item.labelName, margin: [5, 0, 0, 5] }
          ]
        }));
        return checkboxes;
      }
    } catch (error) {
      console.error("Error fetching entity form data:", error);
      throw error;
    }
  }

    async getPdfContent(headerName,tableData,tableName,pdfData){
      let content = [];
      let chartColumn1: Array<any> = [];
      content.push({text : this.nowFacility, alignment : 'center', bold : 'true', fontsize : 60});
      content.push();
      content.push({text : headerName, alignment : 'center', bold : 'true', fontsize : 50, margin: [5, 6]});
      content.push({
        margin : [5, 5],
        columns : [
          {text : 'Activity Name : ' +pdfData?.activityName, alignment : 'left', bold : 'true',fontsize : 50},
          {text : 'Location : ' +pdfData?.destLocationName, alignment : 'right', bold : 'true',fontsize : 50}
        ]
      });
      content.push({
        margin : [5, 5],
        columns : [
          {text : 'Assigned To : ' + pdfData?.assignedTo, alignment : 'left', bold : 'true',fontsize : 50},
          {text : 'Status : ' + pdfData?.requestStatus, alignment : 'right', bold : 'true',fontsize : 50}
        ]
      });
      content.push({text : 'EventDate : '+ this.datepipe.transform(pdfData?.eventDate, 'yyyy-MM-dd HH:mm:ss'), alignment : 'left', bold : 'true', fontsize : 50, margin: [5,6,5,20]});
      if (pdfData['mapElement']) {
        content.push([
              {
                image: pdfData['mapElement'],
                width: 500,
                margin: [5,6,5,20]
              }
          ])
      }
      if (pdfData['formData']) {
        try {
            let formTempData = (await this.configurationService.getFormTemplates(pdfData['formData']['pfFormTemplateId']).toPromise()).results[0];
            let dataItems = formTempData['dataItems'];
            const checkboxes = await this.generateCustomCheckboxes(dataItems, pdfData['formData']['id']);
            content.push([
                { text: formTempData.name, style: 'header',decoration: 'underline',margin: [5, 0, 0, 10] },
                ...checkboxes.map(checkbox => ({
                  ...checkbox,
                  margin: [5, 0, 0, 5] 
                }))
            ]);
            content.push({ text: '', margin: [0, 0, 0, 20] })
        } catch (error) {
            console.error("Error processing form data:", error);
        }
    }
      // for(let i=0;i<chartImage.length;i++){
      //   chartColumn1.push({image : this.getBase64ImageFromImage(chartImage[i]), fit : [250, 250], alignment: 'left',
      //   margin : [10, 15, 10, 50]});
      //   i++;
      //   if(i<chartImage.length){
      //     chartColumn1.push({image : this.getBase64ImageFromImage(chartImage[i]), fit : [250, 250], alignment: 'right',
      //     margin : [10, 15, 10, 50]});
      //   }
      //   content.push({
      //     columns : chartColumn1 
      //   });
      //   chartColumn1 = [];
      // }
      if (tableData && tableData.length && tableName.length) {
          content.push({ text: ' ', pageBreak: 'after' });
          let widthList = [];
          let col = Object.keys(tableData[0]);
          let index2 = col.indexOf('close');
          let index3 = col.indexOf('Reader coordinates');
          if(index2 > -1){
            col.splice(index2, 1)
          }
          if(index3 > -1){
            col.splice(index3, 1)
          }
          widthList = Array(col.length).fill('auto');
          // content.push({ text: tableName,bold : 'true'});
          content.push();
          content.push([{ text: 'Hazmat Training Records', style: 'header',decoration: 'underline',margin: [5, 0, 0, 5] },
          {
            margin: [5, 5],
            table: {
              headerRows: 1,
              widths: widthList,
              body: this.buildTableBody(tableData, col)
            }
          }]);
      } 
      return content;
    }

    public async pdfCreate(pdfData){
        // let chartImage = pdfData['chartImage'];
        let headerName = "Hazmat Training Detail"
        let tableData = pdfData['children'];
        let tableName = "Details:";
        let pageSize = {
            width : 1200,
            height : 800,
          }
        const styles = {
          header: {
            bold: true
          }
        };
        let customerId = localStorage.getItem('customerId')
        let customerLogo = environment.api_base_url_new + environment.base_value.get_customer_logo + '/' + customerId;
        if(!customerLogo){
          customerLogo = this.imageData;
        }
        let header = {
            // margin: [50, 10, 20, 5],
            // height : 80,
            // columns : [
            //     {image : await this.getBase64ImageFromURL(customerLogo),fit : [150, 70], alignment : 'left'},
            // ]
        };
        let content = [];
        content = await this.getPdfContent(headerName,tableData,tableName,pdfData);
        // let documentDefinition = {};
        let documentDefinition = {
        pageSize : 'A4',
        pageOrientation : 'potrait',
        pageMargins : [50, 80, 50, 80],
        header: header,
        content: content,
        styles: styles
        };
        //  pdfMake.createPdf(documentDefinition).download('HazmatDetail'+ '.pdf');
        const pdfDocGenerator = pdfMake.createPdf(documentDefinition);
        pdfDocGenerator.getBlob((blob) => {
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank');
        });
    }
}
