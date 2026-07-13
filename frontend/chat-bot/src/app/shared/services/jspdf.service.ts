import { Injectable } from '@angular/core';
import domtoimage from 'dom-to-image';
import jsPDF from 'jspdf';

@Injectable({
    providedIn: 'root'
  })
export class JspdfService {

    divToPdf(node, id) {
        if (id == 'dashboard') {
            let img;
            let filename;
            let newImage;

            domtoimage.toPng(node, { width: node.scrollWidth, height: node.scrollHeight })

                .then(function (dataUrl) {

                    img = new Image();
                    img.src = dataUrl;
                    newImage = img.src;

                    img.onload = function () {

                        let pdfWidth = img.width;
                        let pdfHeight = img.height;

                        let doc;

                        if (pdfWidth > pdfHeight) {
                            doc = new jsPDF('l', 'px', [pdfWidth, pdfHeight]);
                        }
                        else {
                            doc = new jsPDF('p', 'px', [pdfWidth, pdfHeight]);
                        }


                        let width = doc.internal.pageSize.getWidth();
                        let height = doc.internal.pageSize.getHeight();

                        // doc.addImage(this.imageData,'PNG',10,10)
                        doc.text("Dashboard", 450, 35);//x,y
                        doc.addImage(newImage, 'PNG', 10, 100, width, height);
                        filename = 'Dashboard' + '.pdf';
                        doc.save(filename);

                    };


                })
                .catch(function (error) {

                });
        }
    }

}