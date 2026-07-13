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
import { DatePipe } from "@angular/common";
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Component, EventEmitter, Inject, Input, OnInit, Optional, Output, SimpleChanges, ViewEncapsulation } from "@angular/core";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ActivatedRoute } from "@angular/router";
import { CommonService, ConfigurationService, DashboardService, LayoutExcelService } from "../../../services";
import { ConfirmationDialog } from "../confirmation-dialog/confirmation-dialog.component";
import { ConfirmDialogComponent } from "../layout-save/layout-save.component";
import domtoimage from 'dom-to-image';
import jsPDF from 'jspdf';
import { environment } from "../../../../../environments/environment";
import { AppToastService } from "../../../services/toaster.service";
import { PfModelsEditinfoComponent } from "../pf-models-editinfo/pf-models-editinfo.component";
import { DomSanitizer } from "@angular/platform-browser";

@Component({
    selector: 'app-form-component',
    templateUrl: './form.component.html',
    styleUrls: ['./form.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class formComponent implements OnInit {
    public formTemplate: FormGroup;
    public formTemplateObject = [];
    public enableEdit = false;
    public today = this.datepipe.transform(new Date(), 'yyyy-MM-dd');
    public currentTime = this.datepipe.transform(new Date(), 'HH:mm');
    fileType: string;
    @Input() formTemplateData : any;
    @Input() type : any;
    @Input() formInput : any = { "id" : null , "entityId" : null , "entityType" : null ,"parentId":null,"parentType":null, "pfFormTemplateId" : null, "content" : "form","entityData": null};
    @Input() formConfig : any;
    @Input() enableDrag : boolean;
    @Output() formInputUpdatedData = new EventEmitter();
    @Output() formTemValue = new EventEmitter();
    @Output() formTemplateUpdatedData = new EventEmitter();
    @Output() isSaveEnabled = new EventEmitter();
    @Input() activeAccordionKey: string | null = null;
    @Output() accordionTargetChanged = new EventEmitter<string | null>();
    public selectedSearchData : any = new FormControl(null);
    public col:any;
    public isOpen = false;
    public isFormBind = false;
    public data : any;
    public updateIndexi: any;
    public updateIndexj: any;
    public formTemplateDataObject: any;
    public formTemplateName: any;
    public layout : any;
    public entityFormStatusId = 'EFS-CR';
    public currentStatusEditEnable = false;
    public currentStatusReturnEnable = false;
    public authorizedUser = false;
    public saveEnable = false;
    public nextWorkflowUser = null;
    public sideBarEnable = false;
    public formHistDetails = [];
    public entityFormHistId: any;
    public statusJson = null;
    public userName = localStorage.getItem(btoa('current_user'));
    public enableTabFields = false; 
    public isTabFieldAvailCheck = false;
    public maxRowReached = false;
    public roundTrip = false;
    public enablePdf = false;
    public enableExcel = false;
    public checkedBy = false;
    public reviewedBy = false;
    public formTemplateDetail = {"name" :null, "css" : JSON.stringify({"header":null,"footer":null,"content":null}), "header" : null, "footer" : null, "footerButton": null, "responseResult": null};
    customerLogo: any;
    customerId = localStorage.getItem('customerId');
    imageData: any = '/assets/Alert/common_icons/new-logo.png';
    isExpanded = true;
    cdkConnectedLists: string[] = [];
    activeGap: number | null = null;
    loading = false;
    bannerType = null;
    public activeAccordionGap: { accordionIndexi: number; gapIndex: number } | null = null;
    constructor(public datepipe: DatePipe,public configurationService:ConfigurationService,public dialog: MatDialog, public commonService:CommonService,private readonly activatedRoute: ActivatedRoute,
        @Optional()  private readonly dialogRefr: MatDialogRef<formComponent>,public layoutExcelService: LayoutExcelService, private readonly sanitizer: DomSanitizer){
    }
    ngOnInit() {
        this.buildform();
        this.updateConnectedLists();
    }
    HandleMessageEventListner() {
        window.addEventListener("message", (event) => {
            const data = JSON.stringify(event.data);
            if(window.hasOwnProperty('Android') && (window as any).Android.receiveMessage) {
                (window as any).Android.receiveMessage(data);
            }
        });
    }
     ngOnChanges(changes: SimpleChanges) {
         if (changes['formTemplateData'] && changes['formTemplateData'].currentValue) {
             const newData = changes['formTemplateData'].currentValue;
             const oldData = changes['formTemplateData'].previousValue;

             if (oldData && newData.length === oldData.length &&
                 newData.every((item: any, i: number) => item.key === oldData[i]?.key)) {
                 newData.forEach((item: any) => {
                     if (item.type === 'DI-ACD') {
                         const existing = this.formTemplateObject.find((r: any[]) => r[0]?.key === item.key);
                         if (existing) {
                             existing[0].accordionRows = [...(item.accordionRows || [])];
                             existing[0]._isActiveTarget = item._isActiveTarget || false;

                             existing[0].accordionRows.forEach((row: any[]) => {
                                 row.forEach((field: any) => {
                                     const key = field.name;
                                     if (key && !this.formTemplate.controls[key]) {
                                         let defaultValue = field.defaultValue || null;
                                         if (defaultValue === 'userName') defaultValue = this.userName;
                                         this.formTemplate.addControl(
                                             key,
                                             new FormControl(defaultValue, this.mapValidators(field.validation))
                                         );
                                     }
                                 });
                             });
                         }
                     }
                 });
        this.formTemplateObject = [...this.formTemplateObject];
                 return;
             }
         }
            if (this.enableDrag) {
                     this.isOpen = true
                     this.formTemplate?.disable();
                 } else if (this.enableDrag === false) {
                     this.formTemplate?.enable();
                     this.isOpen = false
                 }
         if (changes['activeAccordionKey'] && !changes['formTemplateData']) {
             return;
         }
         if (changes['enableDrag'] && !changes['formTemplateData']) {
             return;
         }
         if (!changes['formTemplateData']) {
             return;
         }
         this.buildform();
        setTimeout(() => { this.updatePositionsAccurately(); }, 0);
    }
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

    async downloadPDF(
        previewOnly: boolean = true,
        paperSize: 'a1' | 'a2' | 'a3' | 'a4' | 'a5' = 'a4',
        forceOrientation?: 'portrait' | 'landscape'
    ): Promise<void> {
        this.loading = true
        try {
            const logoUrl = `${environment.api_base_url_new}${environment.base_value.get_customer_logo}/${this.customerId}`;
            let customerLogo = await this.getBase64ImageFromURL(logoUrl);

            if (!customerLogo) {
                customerLogo = await this.getBase64ImageFromURL(this.imageData);
            }

            const node = document.getElementById('form-container');
            if (!node) {
                console.error('Element not found: #form-container');
                return;
            }

            const dataUrl = await domtoimage.toPng(node, {
                width: node.scrollWidth + 5,
                height: node.scrollHeight
            });

            const img = new Image();
            img.src = dataUrl;

            img.onload = () => {
                const contentIsLandscape = img.width > img.height;
                const orientation: 'p' | 'l' = forceOrientation
                    ? (forceOrientation === 'landscape' ? 'l' : 'p')
                    : (contentIsLandscape ? 'l' : 'p');

                const doc = new jsPDF({ orientation, unit: 'px', format: paperSize });
                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();

                const margin = 20;
                const headerHeight = 50;
                const footerHeight = 30;
                const contentAreaHeight = pageHeight - headerHeight - footerHeight - (2 * margin);
                const contentAreaWidth = pageWidth - (2 * margin);

                const imgRatio = img.width / img.height;
                const scaledWidth = contentAreaWidth;
                const scaledHeight = scaledWidth / imgRatio;

                const totalPages = Math.ceil(scaledHeight / contentAreaHeight);

                const virtualCanvas = document.createElement('canvas');
                virtualCanvas.width = img.width;
                virtualCanvas.height = img.height;
                const vCtx = virtualCanvas.getContext('2d')!;
                vCtx.drawImage(img, 0, 0);

                for (let i = 0; i < totalPages; i++) {
                    if (i > 0) doc.addPage();

                    if (customerLogo) {
                        doc.addImage(customerLogo, 'JPEG', margin, margin, 40, 40);
                    }
        
                    const facilityName = localStorage.getItem(btoa('customer'));
                    const customer = facilityName?.split(',');
                    let region = '';
                    if(customer?.length > 0) {
                        doc.setFontSize(16);
                        doc.setTextColor(40);
                        doc.setFont(undefined, 'bold');
                        doc.text(customer[0], pageWidth / 2, margin + 20, { align: 'center' });
                        for(let i = 1; i < customer?.length ; i++) {
                            console.log(customer[i], i)
                            region = region !== '' ? region + ',' + customer[i] : region + customer[i];
                        }
                        if(region) {
                            doc.setFontSize(10);
                            doc.setTextColor(40);
                            doc.setFont(undefined, 'bold');
                            doc.text(region, pageWidth / 2, margin + 30, { align: 'center' });
                        }
                    } else {
                        doc.setFontSize(16);
                        doc.setTextColor(40);
                        doc.setFont(undefined, 'bold');
                        doc.text(facilityName, pageWidth / 2, margin + 20, { align: 'center' });
                    }

                    doc.setFontSize(12);
                    doc.setTextColor(40);
                    doc.setFont(undefined, 'bold');
                    doc.text("Date:" + " " + this.datepipe.transform(new Date(), 'dd-MM-yyyy'), pageWidth - 50, margin + 20, { align: 'center' });

                    const sliceHeightInImg = (contentAreaHeight * img.height) / scaledHeight;
                    const sliceY = i * sliceHeightInImg;

                    const sliceCanvas = document.createElement('canvas');
                    sliceCanvas.width = img.width;
                    sliceCanvas.height = sliceHeightInImg;

                    const sliceCtx = sliceCanvas.getContext('2d')!;
                    sliceCtx.drawImage(
                        virtualCanvas,
                        0, sliceY, img.width, sliceHeightInImg,
                        0, 0, img.width, sliceHeightInImg
                    );

                    const sliceDataUrl = sliceCanvas.toDataURL('image/png');

                    doc.addImage(
                        sliceDataUrl,
                        'PNG',
                        margin,
                        margin + headerHeight,
                        scaledWidth,
                        contentAreaHeight
                    );

                    doc.setFontSize(10);
                    doc.setTextColor(100);
                    doc.text(`Page ${i + 1} of ${totalPages}`, pageWidth / 2, pageHeight - margin, { align: 'center' });
                }

                const filename = 'Form.pdf';
                if (previewOnly) {
                    const blob = doc.output('blob');
                    const blobUrl = URL.createObjectURL(blob);
                    window.open(blobUrl, '_blank');
                } else {
                    doc.save(filename);
                }
            };
            this.loading = false;
        } catch (error) {
            this.loading = false;
            console.error('PDF generation failed:', error);
        }
    }

    downloadExcel(){
        let indexi,indexj;
        for(let i=0;i<this.formTemplateObject.length;i++){
            indexi = i;
            indexj = this.formTemplateObject[i].findIndex(res => res.type == 'DI-TABLE');
            if(indexj != -1){
                break;
            }
        }
        if(indexj != -1){
            let tableData = [...this.formTemplate.controls[this.formTemplateObject[indexi][indexj]['key']].value];
            let excelData : any = {};
            excelData['tableData'] = [tableData];
            excelData['sheetName'] = [this.formTemplateDetail['name']];
            excelData['excelFileName'] = [this.formTemplateDetail['name']];
            this.layoutExcelService.exportAsExcelFile(excelData);
        }
    }
    buildform(){
        let dataObject1
        if(this.type == 'gridster'){
            if(this.formTemplateData['id']){
                this.configurationService.getFormTemplates(this.formTemplateData['id'], this.formInput.entityId, this.formInput.entityType, this.formInput.parentId, this.formInput.parentType).subscribe(res =>{
                    if(res.statusCode === 1){
                        let formTempData = res.results[0];
                        this.formTemplateDetail['name'] = formTempData.name;
                        if(formTempData['css'] != null && formTempData['css'] != ""){
                            try{
                                this.formTemplateDetail['css'] = JSON.parse(formTempData['css']);
                            }catch(e){
                                console.log(e);
                            }
                        }
                        if(formTempData['layout']){
                            this.layout = JSON.parse(formTempData['layout']);
                        }
                        this.formTemplateName = formTempData['name'];
                        dataObject1 = formTempData['dataItems'];
                        if(formTempData.jsonValue){
                            let jsonValue = JSON.parse(formTempData.jsonValue);
                            if(jsonValue['col']){
                                this.col = jsonValue['col'];
                            }
                        }
                        this.isFormBind = true;
                        this.createDataObject(dataObject1);
                    }
                });
            }
        } else if(this.type == 'create'){
            dataObject1 = this.formTemplateData;
            this.col = 2;
            if(this.formConfig['layout']){
                this.layout = JSON.parse(this.formConfig['layout']);
            }
            if(this.formConfig){
                let jsonValue = JSON.parse(this.formConfig.jsonValue);
                if(jsonValue['col']){
                    this.col = jsonValue['col'];
                }
                if(jsonValue.hasOwnProperty('footer')){
                    this.formTemplateDetail.footer = jsonValue['footer'];
                    this.formTemplateDetail.header = jsonValue['header'];
                    
                }
                if(this.formConfig['css'] != null && this.formConfig['css'] != ""){
                    try{
                        this.formTemplateDetail['css'] = JSON.parse(this.formConfig['css']);
                    }catch(e){
                        console.log(e);
                    }
                }
            }
            this.createDataObject(dataObject1);
            setTimeout(() => this.updatePositionsAccurately(), 0);
        } else if(this.formInput){
            if(this.formInput.hasOwnProperty('sideBar') && this.formInput['sideBar']){
                this.sideBarEnable = true;
                this.commonService.getEntityFormHistory(this.formInput['id']).subscribe(res =>{
                    if(res.statusCode == 1){
                        this.formHistDetails = res['results'].reverse();
                        this.entityFormHistId = this.formHistDetails[0]['id']
                    }
                    
                })
            }
            this.isFormBind = true;
            if(this.formInput['pfFormTemplateId']){
                this.configurationService.getFormTemplates(this.formInput['pfFormTemplateId'], this.formInput.entityId, this.formInput.entityType, this.formInput.parentId, this.formInput.parentType).subscribe(res =>{
                    if(res.statusCode === 1){
                        let formTempData = res.results[0];
                        this.formTemplateDetail['name'] = formTempData.name;
                        if(formTempData['css'] != null && formTempData['css'] != ""){
                            try{
                                this.formTemplateDetail['css'] = JSON.parse(formTempData['css']);
                            }catch(e){
                                console.log(e);
                            }
                        }
                        if(formTempData['layout']){
                            this.layout = JSON.parse(formTempData['layout']);
                        }
                        this.formTemplateName = formTempData['name'];
                        this.formTemplateData = formTempData['dataItems'];
                        dataObject1 = formTempData['dataItems'];
                        if(formTempData.jsonValue){
                            let jsonValue = JSON.parse(formTempData.jsonValue);
                            if(jsonValue.hasOwnProperty('roundTrip')){
                                this.roundTrip = jsonValue['roundTrip'];
                            }
                            if(jsonValue.hasOwnProperty('enablePdf')){
                                this.enablePdf = jsonValue['enablePdf'];
                            }
                            if(jsonValue.hasOwnProperty('enableExcel')){
                                this.enableExcel = jsonValue['enableExcel'];
                            }
                            if(jsonValue['col']){
                                this.col = jsonValue['col'];
                            }
                            if(jsonValue['footer']){
                                this.formTemplateDetail.footer = jsonValue['footer'];
                                this.formTemplateDetail.header = jsonValue['header'];
                            }
                            let enableWorkflow = jsonValue.hasOwnProperty('approval matrix') ? jsonValue['approval matrix'] : true;
                            if(jsonValue['status'] && enableWorkflow){
                                this.statusJson = jsonValue['status'];
                                if(this.sideBarEnable && this.formHistDetails.length){
                                    for(let i=0;i<this.formHistDetails.length;i++){
                                        let statusName = jsonValue['status'].filter(res => res.code == this.formHistDetails[i]['entityFormStatusId']);
                                        if(statusName.length){
                                            this.formHistDetails[i]['entityFormStatusName'] = statusName[0]['name'];
                                        }
                                    }
                                }
                                if(this.formInput['id'] == null){
                                    //newly created form are in draft status
                                    const statusCode = ['EFS-AP', 'EFS-CA', 'EFS-CR', 'EFS-DR', 'EFS-FN', 'EFS-PA'];
                                    let workflowLevel = jsonValue['status'].filter(res => statusCode.includes(res.code))
                                    if(workflowLevel.length){
                                        this.formTemplateDetail['footerButton'] = workflowLevel[0];
                                        this.entityFormStatusId = workflowLevel[0]['code']
                                    }
                                } else if(this.formInput['id'] != null && this.formInput.hasOwnProperty('entityFormStatus')){
                                    this.getWorkflowLevel(formTempData)
                                    let workflow = [];
                                    // get next level entity status of edit value
                                    let currentStatusData = jsonValue['status'].filter(res => res.code == this.formInput['entityFormStatus']);
                                    if(currentStatusData.length){
                                        let level = currentStatusData[0]['level'];
                                        level = Number(level)+ 1;
                                        let nextWorkflowStatus = jsonValue['status'].filter(res => res.level == level)
                                        if(nextWorkflowStatus.length){
                                            this.currentStatusEditEnable = nextWorkflowStatus[0]['edit'];
                                            this.currentStatusReturnEnable = nextWorkflowStatus[0]['return'];
                                        }
                                    }
                                    if(formTempData['pfWorkflows'].length){
                                        workflow = formTempData['pfWorkflows'].filter(res => ((res.identifyingType == 'RT-US' && res.identifyingId == localStorage.getItem(btoa('userId'))) || (res.identifyingType == 'RT-RO' && res.identifyingId == localStorage.getItem('userlevel'))) && res.isActive && res.workflowLevelId >= currentStatusData[0]['level']);
                                    }
                                    if(workflow.length){
                                        let workflowLevel = jsonValue['status'].filter(res => res.level == Number(workflow[0]['workflowLevelId']))
                                        if(workflowLevel.length) {
                                            let level = workflowLevel[0]['level'];
                                            level = level-1;
                                            let nextLevel = level+2;
                                            if(level>=0){
                                                let previousWorkflowLevel = jsonValue['status'].filter(res => res.level == level)
                                                if(previousWorkflowLevel.length){
                                                    // compare previous level entityFormStatus with current status of entityform
                                                    if(previousWorkflowLevel[0]['code'] == this.formInput['entityFormStatus']){
                                                        if(workflowLevel.length){
                                                            // compare current entity form status with workflowlevel form status
                                                            if(this.formInput['entityFormStatus'] !=  workflowLevel[0]['code']){
                                                                this.formTemplateDetail['footerButton'] = workflowLevel[0];
                                                                // get the next workflow level user details
                                                                let nextWorkflow = formTempData['pfWorkflows'].filter(res => res.workflowLevelId == String(nextLevel) && res.isActive);
                                                                let nextStatusDetail = jsonValue['status'].filter(res => res.level == nextLevel);
                                                                if(nextWorkflow.length && nextStatusDetail.length){
                                                                    this.nextWorkflowUser = nextStatusDetail[0]['name']+" to "+nextWorkflow[0]['userName']+" ("+ nextWorkflow[0]['description']+ ").";
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            } else{
                                                //current entityformstatus with draft status
                                                if(workflowLevel.length){
                                                    this.formTemplateDetail['footerButton'] = workflowLevel[0];
                                                }
                                            }
                                        }
                                    }else{
                                        // if the user not in the approval matrix level need to hide the edit option
                                        this.currentStatusEditEnable = false;
                                        this.currentStatusReturnEnable =false;
                                    }

                                }
                            } else{
                                // enable save button, if there is no status info in template option
                                this.saveEnable = true;
                                this.currentStatusEditEnable = true;
                            }
                        }
                        if(this.formInput['entityId'] != null && this.formInput['entityData'] == null){
                            if(this.formInput['entityType'] == 'asset'){
                                this.configurationService.getAssetsById(this.formInput['entityId']).subscribe(res =>{
                                    this.formInput['entityData'] = res;
                                    this.createDataObject(dataObject1,this.formInput['id']);
                                })
                            } else if(this.formInput['entityType'] == 'request'){ // PWA support form addition without valid asset selection based on entityType request
                               this.createDataObject(dataObject1,this.formInput['id']);
                            }
                        } else {
                            this.createDataObject(dataObject1,this.formInput['id']);
                        }
                    }
                });
            }
        }
        this.bannerType = this.formInput && this.formInput.hasOwnProperty('bannerType') ? this.formInput['bannerType'] : 'TW-FD';
    }
  toggleDrawer() {
    this.isExpanded = !this.isExpanded;
  }
    getWorkflowLevel(formTempData) {
        let preStatus = this.formInput['entityFormStatus'] ? this.formInput['entityFormStatus'] : null;
        let jsonValue = JSON.parse(formTempData.jsonValue)
        if (jsonValue.hasOwnProperty('status')) {
            let preLvl = jsonValue.status.filter(val => val.code == preStatus);
            if(preLvl.length) {
                let curerntLvl = parseInt(preLvl[0]["level"]) + 1;
                let curerntStutus = formTempData['pfWorkflows'].filter(res => res.workflowLevelId == String(curerntLvl) && res.isActive);
                if(curerntStutus.length == 0) {
                    curerntStutus = jsonValue.status.filter(val => val.level == String(curerntLvl));
                    if(curerntStutus.length) {
                        let nextLevel = parseInt(preLvl[0]["level"]) + 2;
                        let nextWorkflow = formTempData['pfWorkflows'].filter(res => res.workflowLevelId == String(nextLevel) && res.isActive);
                        let nextStatusDetail = jsonValue['status'].filter(res => res.level == nextLevel);
                        if(nextWorkflow.length && nextStatusDetail.length){
                            this.nextWorkflowUser = nextStatusDetail[0]['name']+" to "+nextWorkflow[0]['userName']+" ("+ nextWorkflow[0]['description']+ ").";
                        }
                        this.formTemplateDetail['footerButton'] = curerntStutus[0];
                    }
                }                        
            }
        }
    }
    private _liveAccordionSnapshot: Map<string, any[]> | null = null;
    private createDataObject(dataObject1,entityFormId?) {
     dataObject1.forEach((item: any) => {
        if (item.type === 'DI-ACD') {
            item['key'] = item['key'] || item.name + '_' + Date.now();
            item['validator'] = { show: true };
            item['accordionExpanded'] = true;
            item['_isActiveTarget'] = false;
            item['accordionTitle'] = item.labelName;

        if (item.children && item.children.length) {
        const layout = this.layout ? (typeof this.layout === 'string' ? JSON.parse(this.layout) : this.layout): {};
        const rowMap: any = {};
        item.children.forEach((child: any, idx: number) => {
            const position = layout[child.name] || 
                            `R01C${idx.toString().padStart(2, '0')}`;
            const rowKey = position.substring(0, 3);
            const colIdx = parseInt(position.substring(4, 6));
            let outputResponse = child.outputResponse || null;
            try {
                if (typeof child.customValue === 'string' && child.customValue && outputResponse == null) {
                    outputResponse = JSON.parse(child.customValue);
                }
            } catch (e) { }
            let tempCustomCss: any = { content: null, di: null };
            if (typeof child.customCss === 'string') {
            try {
                const customCss = JSON.parse(child.customCss);
                if (customCss.hasOwnProperty('di')) {
                    tempCustomCss = customCss;
                } else {
                    tempCustomCss = { content: null, di: customCss };
                }
            } catch(e) {
                tempCustomCss = { content: null, di: null };
            }
        }

            if (!rowMap[rowKey]) rowMap[rowKey] = [];
            rowMap[rowKey][colIdx] = {
                ...child,
                key: child.name,
                position: position,
                tempCustomCss: tempCustomCss,  
                validator: child.validation ?
                    { ...JSON.parse(child.validation), show: true } :
                    { show: true }
            };
        });
            item['accordionRows'] = Object.keys(rowMap).sort().map((key: string) => rowMap[key].filter(Boolean));
            item['accordionTitle'] = item.labelName;
             } else {
    const snapshotRows = this._liveAccordionSnapshot?.get(item['key']);
    if (snapshotRows && snapshotRows.length) {
        item['accordionRows'] = snapshotRows;
        if (!item['accordionTitle']) {
            item['accordionTitle'] = item.labelName;
        }
    } else if (item['accordionRows'] && item['accordionRows'].length) {
        if (!item['accordionTitle']) item['accordionTitle'] = item.labelName;
    } else if (item.contextValue) {
        try {
            const parsed = JSON.parse(item.contextValue);
            item['accordionRows'] = parsed.accordionRows || [];
            item['accordionTitle'] = parsed.accordionTitle || item.labelName;
        } catch(e) {
            item['accordionRows'] = [];
            item['accordionTitle'] = item.labelName;
        }
    } else {
        item['accordionRows'] = item['accordionRows'] || [];
        item['accordionTitle'] = item['accordionTitle'] || item.labelName;
    }
}
 if (item['accordionRows']) {
        item['accordionRows'].forEach((row: any[]) => {
            row.forEach((field: any) => {
                this.ensureTempCustomCss(field);
            });
        });
    }
         }
     });
    dataObject1 = dataObject1.filter((val: any) => {
        if (val.type === 'DI-ACD') return val.status !== false;
        return val.status;
    });
    this.formTemplateDataObject = dataObject1.filter((v: any) => v.type !== 'DI-ACD');
        dataObject1.forEach((element,index) => {
            if(!element.hasOwnProperty('position')) {
                element['position'] = null;
            }
            if(this.layout){
                if(this.layout.hasOwnProperty(element['name'])){
                    element['position'] = this.layout[element['name']];
                }
            }
            if(element['type'] == 'DI-TABLE'){
                if(element['contextValue']){
                    element['contextValueTable']= JSON.parse(element['contextValue']);
                }
                
            }
        });
        dataObject1 = this.commonService.sortByKey(dataObject1,'position');
        let dataObject = [];
        let tempObj = [];
        let posValue = null;
        if(this.layout){
            dataObject1.forEach((element, index) => {
            if (element.type === 'DI-ACD') {
                if (tempObj.length) {
                    dataObject.push(tempObj);
                    tempObj = [];
                }
                dataObject.push([element]);
                posValue = null;
                return;
            }
                element['tempCustomCss'] = {"content" : null, "di" : null};
                try{
                    if(typeof(element.customCss) === 'string'){
                        let customCss = JSON.parse(element.customCss);
                        if(customCss.hasOwnProperty('di')) {
                            element['tempCustomCss'] = customCss;
                        } else {
                            element['tempCustomCss']["di"] = customCss;
                            element['tempCustomCss']["content"] = null;
                        }
                    }
                } catch(e){
                    element['tempCustomCss'] = {"content" : null, "di" : null};
                }
                try{
                    if(typeof(element.customValue) === 'string' && element.outputResponse == null){
                        element['outputResponse'] = JSON.parse(element.customValue);
                    }
                } catch(e) {

                }
                try{
                    if(typeof(element.defaultValue) === 'string' && element.defaultValue != null){
                        element['defaultValue'] = JSON.parse(element.defaultValue);
                    }
                } catch(e) {

                }
                try{
                    element['dataBind'] = {"key":"code","value":"value"};
                    if(element.hasOwnProperty('validation')){
                        let validationJson = JSON.parse(element.validation);
                        if(validationJson.hasOwnProperty('dataBind')){
                            element['dataBind'] = validationJson['dataBind'];
                        }
                        element['isTableField'] = false;
                        if (validationJson.hasOwnProperty('isTableField')) {
                            element['isTableField'] = validationJson['isTableField'];
                            if(element['isTableField']){
                                this.isTabFieldAvailCheck = true;
                            }
                        }
                    }
                } catch(e) {

                }
                let pos2 = null;
                if(element['position']) {
                    pos2 = element['position'].substring(0,3)
                }
                if(posValue == pos2){
                    tempObj.push(element);
                    if(this.col <= tempObj.length){
                        this.col = tempObj.length;
                    }
                    if(dataObject1.length - 1 == index) {
                        dataObject.push(tempObj);
                    }
                } else{
                    posValue = pos2;
                    if(tempObj.length) {
                        dataObject.push(tempObj);
                    }
                    tempObj = [];
                    tempObj.push(element);
                    if(dataObject1.length - 1 == index) {
                        dataObject.push(tempObj);
                    }
                }
            });
            if(!this.isTabFieldAvailCheck){
                // to enableTabFields need to disappear btn if there is no fields for table
                this.enableTabFields = true;
            }
    } else {
        dataObject1.forEach((element: any, i: number) => {
            if (element.type === 'DI-ACD') {
                if (tempObj.length) {
                    dataObject.push(tempObj);
                    tempObj = [];
                }
                dataObject.push([element]);
                return;
            }
            element['tempCustomCss'] = null;
            if (typeof(element.customCss) === 'string') {
                try {
                    let customCss = JSON.parse(element.customCss);
                    element['tempCustomCss'] = customCss.hasOwnProperty('di') ? customCss : { "content": null, "di": customCss };
                } catch(e) {}
            }
            if (tempObj.length < this.col) {
                tempObj.push(element);
            } else {
                dataObject.push(tempObj);
                tempObj = [];
                tempObj.push(element);
            }
            if (i == (dataObject1.length - 1)) dataObject.push(tempObj);
        });
        }
        this.formTemplateObject = [];
        this.formDataItemBinding(dataObject,entityFormId);
    }
    formDataItemBinding(dataObject,entityFormId?){
        const formGroup = {};
        let index=0;
        for(let i=0;i<dataObject.length;i++){
            if (dataObject[i][0]?.type === 'DI-ACD') {
                this.formTemplateObject[i] = dataObject[i];
                const acc = dataObject[i][0];
                (acc.accordionRows || []).forEach((accRow: any[]) => {
                    accRow.forEach((field: any) => {
                        const key = field.key || field.name;
                        if (key && !formGroup[key]) {
                            let defaultValue = field.defaultValue || null;
                            if (defaultValue === 'userName') defaultValue = this.userName;
                            formGroup[key] = new FormControl(
                                defaultValue,
                                this.mapValidators(field.validation)
                            );
                        }
                    });
                });
                continue;
            }
            this.formTemplateObject[i] = Object.keys(dataObject[i]).map(prop => {
                if(dataObject[i][prop]['validation']){
                    let validator = JSON.parse(dataObject[i][prop]['validation'])
                    validator['show'] = true;
                    if (this.formInput.pfFormTemplateId && this.formTemplateDetail['footerButton'] && this.formInput.entityId && validator?.approvalLevel && validator?.approvalLevel > this.formTemplateDetail['footerButton']['level']) {
                        validator['show'] = false;
                    }
                    if (this.formInput.pfFormTemplateId && this.formTemplateDetail['footerButton'] && this.formInput.entityId && validator?.approvalLevel && validator?.approvalLevel < this.formTemplateDetail['footerButton']['level']) {
                        validator['disabled'] = true;
                    }
                    return Object.assign({}, dataObject[i][prop], { key: dataObject[i][prop]['name'],validator: validator  });
                } else{
                    return Object.assign({}, dataObject[i][prop], { key: dataObject[i][prop]['name'],validator: {'show' : true} });
                }
            });
            for (let propObj of Object.keys(dataObject[i])) {
                if(dataObject[i][propObj]['type'] == 'DI-DTE'){
                    if(dataObject[i][propObj]['defaultValue'] == "Blank"){
                        formGroup[dataObject[i][propObj]['name']] = new FormControl(null);
                    } else{
                        formGroup[dataObject[i][propObj]['name']] = new FormControl(this.today || null);
                    }
                } else if(dataObject[i][propObj]['type'] == 'DI-TIM'){
                    if(dataObject[i][propObj]['defaultValue'] == "currentTime"){
                        formGroup[dataObject[i][propObj]['name']] = new FormControl(this.currentTime || '00:00');
                    } else{
                        formGroup[dataObject[i][propObj]['name']] = new FormControl(null);
                    }
                } else{
                    let defaultValue = dataObject[i][propObj]['defaultValue'] || null;
                    if(defaultValue === 'userName'){
                        defaultValue = this.userName;
                    }
                    if(dataObject[i][propObj]['type'] == 'DI-DRD' && dataObject[i][propObj]['multiSelect']){
                        defaultValue = [defaultValue];
                    }
                    if(this.formInput){
                        if(this.formInput.hasOwnProperty('entityData') && this.formInput['entityData'] && dataObject[i][propObj]['contextValue']){
                            let contextValue;
                            try{
                                contextValue = JSON.parse(dataObject[i][propObj]['contextValue']);
                                if(contextValue.hasOwnProperty('IN')){
                                    if(this.formInput['entityData'].hasOwnProperty(contextValue['IN'])){
                                        defaultValue = this.formInput['entityData'][contextValue['IN']]
                                    }
                                }
                            } catch(e){
                                console.log(e)
                            }
                        }
                    }
                    formGroup[dataObject[i][propObj]['name']] = new FormControl(defaultValue, this.mapValidators(dataObject[i][propObj]['validation']));
                }
            }
            index=index+1;
        }
        this.formTemplate = new FormGroup(formGroup);
        if(entityFormId){
            this.getEntityFormDetails(entityFormId);
        }
    }
    getEntityFormDetails(entityFormId){
        this.configurationService.getEntityForm(entityFormId).subscribe(res =>{
            if(res.statusCode == 1 && res.results.length){
                this.formEntityBinding(res.results[0])
                let lastLevel = this.statusJson && this.statusJson.length ? this.statusJson[this.statusJson.length - 1]['code'] : null;
                if(res.results[0]['createdBy'] == localStorage.getItem(btoa('userId')) && (lastLevel == null || lastLevel != res.results[0]['entityFormStatusId'])){
                    this.authorizedUser = true;
                }
            }
        })
    }
    formEntityBinding(entityFormDetail){
        this.entityFormStatusId =  entityFormDetail['entityFormStatusId'];
        let formValue = entityFormDetail['formValue'];
        for (let key in formValue) {
            if(this.formTemplate.value.hasOwnProperty(key)){
                let formTempList = this.formTemplateDataObject.filter(res => res.name == key)
                if(formTempList.length){
                    if(formTempList[0]['type'] === 'DI-DRD'){
                        if(formTempList[0]['multiSelect'] && !Array.isArray(formValue[key])){
                            this.formTemplate.controls[key].setValue([formValue[key]]);
                        } else if(formTempList[0]['multiSelect'] == false && Array.isArray(formValue[key])){
                            let value = formValue[key].length ? formValue[key][0] : null;
                            this.formTemplate.controls[key].setValue(value);
                        } else {
                            this.formTemplate.controls[key].setValue(formValue[key]);
                        }
                        
                    }else{
                        this.formTemplate.controls[key].setValue(formValue[key]);
                    }
                }
            }
        }
           this.formTemplateObject.forEach((row: any[]) => {
        if (row[0]?.type === 'DI-ACD') {
            (row[0].accordionRows || []).forEach((accRow: any[]) => {
                accRow.forEach((field: any) => {
                    const key = field.key || field.name;
                    if (key && formValue.hasOwnProperty(key)) {
                        // Add control if missing (accordion fields may not be in formGroup yet)
                        if (!this.formTemplate.controls[key]) {
                            this.formTemplate.addControl(
                                key,
                                new FormControl(
                                    formValue[key],
                                    this.mapValidators(field.validation)
                                )
                            );
                        } else {
                            this.formTemplate.controls[key].setValue(formValue[key]);
                        }
                    }
                });
            });
        }
    });
    }
    private mapValidators(validators) {
        const formValidators = [];
        if (validators) {
            validators = JSON.parse(validators);
          for (const validation of Object.keys(validators)) {
            if (validation === 'required' && validators[validation]) {
              formValidators.push(Validators.required);
            } else if (validation === 'minLength') {
              formValidators.push(Validators.minLength(validators[validation]));
            } else if (validation === 'maxLength') {
              formValidators.push(Validators.maxLength(validators[validation]));
            }
          }
        }
        return formValidators;
      }
      uploadFile(event,indexi,indexj){
        const files = event.target.files;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (files && file) {
              this.fileType = file.type;
              const reader = new FileReader();
              reader.onload = this._handleReaderLoaded.bind(this,indexi,indexj);
              reader.readAsBinaryString(file);
              
            }
        }
    }
    _handleReaderLoaded(indexi,indexj,readerEvt) {
        const binaryString = readerEvt.target.result;
        
        const base64Data = btoa(binaryString);
        this.formTemplateObject[indexi][indexj]['value'] = base64Data;
    
    }
    getSearchText(selectedData,indexi,indexj){
        this.formTemplateObject[indexi][indexj]['value'] = selectedData['id'];
    }
    displayFn(field: any,option: any): string {
        const searchData = option;
        const fieldDat = field;
        if (searchData) {
            const selectedVal = fieldDat.outputResponse ? fieldDat.outputResponse : [];
            if(fieldDat.hasOwnProperty("dataBind")){
                const displayData = selectedVal.find(obj => obj[fieldDat.dataBind.key] === searchData);
                if(displayData != undefined) {
                    return displayData[fieldDat.dataBind.value];
                }
            }
        } 
        return '';
    }
    getSearchlist(id,indexi,indexj) {
        if(id){
          let searchData = '';
          searchData += id.target.value;
          if (searchData.length >= 3 && this.formTemplateObject[indexi][indexj]['pfModelData'].hasOwnProperty('url')) {
            if(this.formTemplateObject[indexi][indexj]['pfModelData']['url']){
                this.configurationService.getApiSearchData(this.formTemplateObject[indexi][indexj]['pfModelData']['url'],id.target.value).subscribe(res => {
                    this.formTemplateObject[indexi][indexj]['outputResponse'] = res.results;
                });
            }
          } else {
            this.selectedSearchData.setValue(null)
            this.formTemplateObject[indexi][indexj]['outputResponse'] = [];
          }
        } else{
            this.selectedSearchData.setValue(null)
            this.formTemplateObject[indexi][indexj]['outputResponse'] = [];
        }
    }
    getWidgetData(value){
        if (this.validate(this.formTemplate.controls['fdt'].value, this.formTemplate.controls['tdt'].value)) {
            this.formTemValue.emit([this.formTemplate,this.formTemplateObject,value]);
        }
    }
    validate(sDate: string, eDate: string) {
        let validDate = true;
        if ((sDate != null && eDate != null) && (eDate < sDate)) {
            validDate = false;
            console.log("From Date should not be greater than To Date")
        }
        return validDate;
    }
    deleteDataItem(indexi,indexj){
         if (this.formTemplateObject[indexi][0]?.type === 'DI-ACD') {
        this.formTemplateObject[indexi][0].status = false;
        this.formTemplateObject[indexi][0]._isActiveTarget = false;
    } else {
        if(this.formTemplateObject[indexi][indexj]['pfFormTemplateDataItemId'] == null){
            this.formTemplateObject[indexi].splice(indexj,1);
        } else{
            this.formTemplateObject[indexi][indexj]['status'] = false;
        }
    }
        let newArr = [];
        for(let i = 0; i < this.formTemplateObject.length; i++)
        {
            newArr = newArr.concat(this.formTemplateObject[i]);
        }
        this.createDataObject(newArr);
        this.formTemplateUpdatedData.emit(newArr);
    }
    editDataItem(indexi,indexj){
        this.data = this.formTemplateObject[indexi][indexj];
        this.updateIndexi = indexi;
        this.updateIndexj = indexj;
        const dialogRef = this.dialog.open(editFormComponent, {
            data: this.data,panelClass: ['medium-popup'], disableClose: true
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.formTemplateObject[indexi][indexj] = result;
                this.updateDataItem();
            }
             this.exitValue();
        });
    }
    updateTableCols(indexi,indexj){
        let data = {
            "contextValue" : this.formTemplateObject[indexi][indexj]['contextValue'],
            "formTemplateData": this.formTemplateData
        }
        const dialogRef = this.dialog.open(tableUpdateComponent,{data:data,panelClass: ['small-popup'], disableClose: true});
        dialogRef.afterClosed().subscribe(result => {
            if(result && result['selectedOption'].length){
                const names = result['selectedOption'].map(item => item.name);
                const labelName = result['selectedOption'].map(item => item.labelName);
                const labelValue = result['selectedOption'].map(item => ({
                    [item.name]: item.labelName
                }));
                this.formTemplateObject[indexi][indexj]['contextValueTable'] ={};
                this.formTemplateObject[indexi][indexj]['contextValueTable']={"name":names,"column":labelName,"data":[],"action":{"edit":result['edit'],"delete":result['delete']},"add":true,"labelValue":labelValue};
                this.formTemplateObject[indexi][indexj]['contextValue']=JSON.stringify(this.formTemplateObject[indexi][indexj]['contextValueTable'])
                this.updateDataItem();
            }
          });
    }
    updateDataValue(result){
        this.formTemplateObject[this.updateIndexi][this.updateIndexj] = result;
        this.updateDataItem();
    }
    updateDataItem(){
        let newArr = [];
        for(let i = 0; i < this.formTemplateObject.length; i++){
            if (this.formTemplateObject[i][0]?.type === 'DI-ACD') {
                newArr.push(this.formTemplateObject[i][0]);
            } else {
            newArr = newArr.concat(this.formTemplateObject[i]);
            }
        }
        this.formTemplateUpdatedData.emit(newArr);
    }
    exitValue(){
        if (this.enableDrag) return;
        this.isOpen = !this.isOpen;
        this.isSaveEnabled.emit(!this.isOpen)
    }
    returnStatus(){
        const dialogRef = this.dialog.open(ConfirmationDialog, {
            panelClass:['mdm-Confirmation-popup'], disableClose: true,
            data: {
            title: "Confirmation", message: "Do you want to return the form?",
            buttonText: { ok: 'Yes', cancel: 'No' },'isRemark': 0,formStatusEnable: true
            }
        });
        dialogRef.afterClosed().subscribe(result => {
            this.formTemplateDetail['responseResult']  = result;
            if(this.formTemplateDetail['responseResult']['confirmButtonText'] == 'Yes'){
                if(this.statusJson){
                    let level = this.formTemplateDetail['footerButton']['level'];
                    level = level - 2;
                    let prevWorkflowStatus = this.statusJson.filter(res => res.level == level);
                    if(prevWorkflowStatus.length){
                        this.entityFormStatusId = prevWorkflowStatus[0]['code'];
                        this.postFormData();
                    }
                }
                this.dialogRefr.close();
            }
            return result;
        });
    }
    confirmDelete(indexi,indexj){
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            panelClass:['confirmation-popup'],
            data: {
              title: 'Confirmation',
              message: 'Are you sure you want to delete dataitem?',
              buttonText: {
                ok: 'Yes',
                cancel: 'No'
              }
            }
          });
          dialogRef.afterClosed().subscribe(result => {
            if (result == 'Yes') {
                this.deleteDataItem(indexi,indexj);
            }
          });
    }
    updateTableColsDefault(){
        let indexi,indexj;
        for(let i=0;i<this.formTemplateObject.length;i++){
            indexi = i;
            indexj = this.formTemplateObject[i].findIndex(res => res.type == 'DI-TABLE');
            if(indexj != -1){
                break;
            }
        }
        let updateList = this.formTemplate.controls[this.formTemplateObject[indexi][indexj]['key']].value;
        this.formTemplate.controls[this.formTemplateObject[indexi][indexj]['key']].setValue = updateList.map(item => {
            if(this.checkedBy){
                item["Checked by"] = this.userName;
            }
            if(this.reviewedBy){
                item["Reviewed by"] = this.userName; 
            }
            
            return item;
        });
        this.postFormData();
    }
    sendForApproveDialog(title,message){
        const dialogRef = this.dialog.open(ConfirmationDialog, {
            panelClass:['mdm-Confirmation-popup'], disableClose: true,
            data: {
            title: title, message: message,
            buttonText: { ok: 'Yes', cancel: 'No' },'isRemark': 0,formStatusEnable: true
            }
        });
        dialogRef.afterClosed().subscribe(result => {
            this.formTemplateDetail['responseResult']  = result;
            if(this.formTemplateDetail['responseResult']['confirmButtonText'] == 'Yes'){
                if(this.roundTrip && (this.checkedBy || this.reviewedBy)){
                    this.updateTableColsDefault();
                }else{
                    //post form data via popup confiramtion for button like final
                    this.postFormData();
                }
                
                // this.dialogRefr.close();
            }
        });
    }
    bindDataToTable(indexi,indexj,type,tableIndex?){
        if(this.formTemplate.controls[this.formTemplateObject[indexi][indexj]['key']].value){
            if(this.formTemplate.controls[this.formTemplateObject[indexi][indexj]['key']].value.length && !this.formTemplateObject[indexi][indexj]['contextValueTable']['data'].length){
                this.formTemplateObject[indexi][indexj]['contextValueTable']['data'] = this.formTemplate.controls[this.formTemplateObject[indexi][indexj]['key']].value;
            }
        }
        if(type == 'add' || type == 'edit'){
            let tempTableData = [];
            let labelValue = this.formTemplateObject[indexi][indexj]['contextValueTable']['labelValue'];
            const values = this.formTemplate.value;
            const boundValues: { [key: string]: any } = {};
            labelValue.forEach(field => {
                const key = Object.keys(field)[0];
                const newKey = field[key];
                boundValues[newKey] = values[key];
            });
            if(this.formTemplateObject[indexi][indexj]['contextValueTable']['data'].length){
                tempTableData = [...this.formTemplateObject[indexi][indexj]['contextValueTable']['data']];
            }
            if(type == 'add'){
                if(this.formTemplateObject[indexi][indexj]['contextValueTable'].hasOwnProperty('maxRow')){
                    if(this.formTemplateObject[indexi][indexj]['contextValueTable']['data'].length < this.formTemplateObject[indexi][indexj]['contextValueTable']['maxRow']){
                        tempTableData.push(boundValues);
                        this.formTemplateObject[indexi][indexj]['contextValueTable']['data'] = [];
                        this.formTemplateObject[indexi][indexj]['contextValueTable']['data'] = [...tempTableData];
                    }
                    if(this.formTemplateObject[indexi][indexj]['contextValueTable']['data'].length == this.formTemplateObject[indexi][indexj]['contextValueTable']['maxRow']){
                        this.maxRowReached = true;
                    }
                }else{
                    tempTableData.push(boundValues);
                    this.formTemplateObject[indexi][indexj]['contextValueTable']['data'] = [];
                    this.formTemplateObject[indexi][indexj]['contextValueTable']['data'] = [...tempTableData];
                }
                
            }else{
                if(this.formTemplateObject[indexi][indexj]['contextValueTable'].hasOwnProperty('editRowIndex')){
                    let editRowIndex = this.formTemplateObject[indexi][indexj]['contextValueTable']['editRowIndex'];
                    this.formTemplateObject[indexi][indexj]['contextValueTable']['data'][editRowIndex] = boundValues;
                    this.formTemplateObject[indexi][indexj]['contextValueTable']['data'] = [...this.formTemplateObject[indexi][indexj]['contextValueTable']['data']]
                }
            }
            this.formTemplateObject.forEach(element => {
                element.forEach(updateElement =>{
                    let formInputDefaultValue = null;
                    if(this.formInput){
                        if(this.formInput.hasOwnProperty('entityData') && this.formInput['entityId'] && this.formInput['entityData'] && updateElement['contextValue']){
                            let contextValue;
                            try{
                                contextValue = JSON.parse(updateElement['contextValue']);
                                if(contextValue.hasOwnProperty('IN')){
                                    if(this.formInput['entityData'].hasOwnProperty(contextValue['IN'])){
                                        formInputDefaultValue = this.formInput['entityData'][contextValue['IN']]
                                    }
                                }
                            } catch(e){
                                console.log(e)
                            }
                        }
                    }
                    if(updateElement.type == 'DI-DTE'){
                        if(formInputDefaultValue){
                            this.formTemplate.controls[updateElement['key']].setValue(formInputDefaultValue);
                        }else if(updateElement['defaultValue'] == "Blank"){
                            this.formTemplate.controls[updateElement['key']].setValue(null);
                        }else{
                            this.formTemplate.controls[updateElement['key']].setValue(this.today || null);
                        }
                    }else if(updateElement.type == 'DI-TIM'){
                        if(formInputDefaultValue){
                            this.formTemplate.controls[updateElement['key']].setValue(formInputDefaultValue);
                        }else if(updateElement['defaultValue'] == "currentTime"){
                            this.formTemplate.controls[updateElement['key']].setValue(this.currentTime || '00:00');
                        } else{
                            this.formTemplate.controls[updateElement['key']].setValue(null);
                        }
                    }else if(updateElement.type == 'DI-DRD' && updateElement['multiSelect']){
                        if(formInputDefaultValue){
                            this.formTemplate.controls[updateElement['key']].setValue([formInputDefaultValue]);
                        }else{
                            this.formTemplate.controls[updateElement['key']].setValue([updateElement['defaultValue']]);
                        }
                    }else if(updateElement.type != 'DI-TABLE'){
                        if(formInputDefaultValue){
                            this.formTemplate.controls[updateElement['key']].setValue([formInputDefaultValue]);
                        }else{
                            this.formTemplate.controls[updateElement['key']].setValue(updateElement['defaultValue']);
                        }
                    } 
                    if(updateElement['defaultValue'] === 'userName'){
                        this.formTemplate.controls[updateElement['key']].setValue(this.userName);
                    }
                    
                })
            });
        }else if(type == 'delete'){
            this.formTemplateObject[indexi][indexj]['contextValueTable']['data'].splice(tableIndex,1);
            this.formTemplateObject[indexi][indexj]['contextValueTable']['data'] = [...this.formTemplateObject[indexi][indexj]['contextValueTable']['data']];
            if(this.maxRowReached){
                this.maxRowReached = false;
            }
        }
        this.formTemplate.controls[this.formTemplateObject[indexi][indexj]['key']].setValue(this.formTemplateObject[indexi][indexj]['contextValueTable']['data']);
        
    }
    updateTable(eventData,indexi,indexj){
        if(eventData['type'] == 'edit'){
            let labelValue = this.formTemplateObject[indexi][indexj]['contextValueTable']['labelValue'];
            const values = eventData['data']
            labelValue.forEach(field => {
                const key = Object.keys(field)[0];
                const newKey = field[key];
                this.formTemplate.controls[key].setValue(values[newKey]);
            });
            this.formTemplateObject[indexi][indexj]['contextValueTable']['editRowIndex'] = eventData['tableIndex'];
            this.enableEdit = true;
        }else{
            this.bindDataToTable(indexi,indexj,eventData['type'],eventData['tableIndex'])
        }
        
    }
    closeForm() {
        try {
            this.dialogRefr.close();
        } catch(e) {
            console.log(e)
        }
        this.emitParent('form', 'close', null)
        
    }
    emitParent(type, operation, data) {
        const message = { type: type, operation : operation, response : data};
        window.parent.postMessage(message, '*');
        this.HandleMessageEventListner()
    }
    saveFormData(status?:any){
        if(status){
            //update form data for save button
            this.postFormData();
        } else{
            if(this.formTemplateDetail['footerButton'] != null){
                if(this.formTemplateDetail['footerButton']['code'] == 'EFS-FN' || this.formTemplateDetail['footerButton']['code'] == 'EFS-PA' || this.formTemplateDetail['footerButton']['code'] == 'EFS-AP'){
                    if(this.formTemplateDetail['footerButton'].hasOwnProperty('checkedBy')){
                        this.checkedBy = this.formTemplateDetail['footerButton']['checkedBy'];
                    }
                    if(this.formTemplateDetail['footerButton'].hasOwnProperty('reviewedBy')){
                        this.reviewedBy = this.formTemplateDetail['footerButton']['reviewedBy'];
                    }
                    this.sendForApproveDialog("Confirmation","Do you want to save and submit this document for approval?");
                    this.entityFormStatusId = this.formTemplateDetail['footerButton']['code'];
                } else{
                    //post form data for draft button
                    this.postFormData();
                }
            }
        }
    }
    postFormData(){
        let comments = null;
        if(this.formTemplateDetail['responseResult'] && this.formTemplateDetail['responseResult'].hasOwnProperty('comments')){
            comments = this.formTemplateDetail['responseResult']['comments'];
        }
        const accordionChildren = [];
        this.formTemplateObject.forEach((row: any[]) => {
            if (row[0]?.type === 'DI-ACD') {
                const acc = row[0];
                const childFields = {};
                (acc.accordionRows || []).forEach((accRow: any[]) => {
                    accRow.forEach((field: any) => {
                        const key = field.key || field.name;
                        if (key && this.formTemplate.controls[key]) {
                            childFields[key] = this.formTemplate.controls[key].value;
                        }
                    });
                });
                accordionChildren.push({
                    key: acc.key,
                    labelName: acc.accordionTitle || acc.labelName,
                    fields: childFields
                });
            }
        });
        const accordionFormValues: Record<string, any> = {};
        this.formTemplateObject.forEach((row: any[]) => {
            if (row[0]?.type === 'DI-ACD') {
                (row[0].accordionRows || []).forEach((accRow: any[]) => {
                    accRow.forEach((field: any) => {
                        const key = field.key || field.name;
                        if (key && this.formTemplate.controls[key]) {
                            accordionFormValues[key] = this.formTemplate.controls[key].value;
                        }
                    });
                });
            }
        });
        let postData ={
            "id": null,
            "entityId": this.formInput['entityId'],
            "entityType": this.formInput['entityType'],
            "parentId":this.formInput['parentId'],
            "parentType":this.formInput['parentType'],
            "pfFormTemplateId": this.formInput['pfFormTemplateId'],
            "status": true,
            "formValue": { ...this.formTemplate.value, ...accordionFormValues },
            "name": this.formTemplateName,
            "entityFormStatusId":this.entityFormStatusId,
            "comments":comments,
            "children": accordionChildren.length ? accordionChildren : null
        }
        if (this.formInput?.entityType == 'pf_activity') {
            delete postData.parentId;
            delete postData.parentType;
        }
        let filterValue = this.formTemplateDataObject.filter(val => val['contextValue'] != null)
        for(let i=0;i<filterValue.length;i++){
            let contextValue;
            try{
                contextValue = JSON.parse(filterValue[i]['contextValue']);
                if(contextValue.hasOwnProperty('OUT')){
                    postData[contextValue['OUT']] = this.formTemplate.value[filterValue[i]['name']]
                }
            } catch(e){
                console.log(e)
            }
        }
        console.log(postData)
        if(this.dialogRefr && (this.formInput['entityType'] == 'Request' || (this.formInput['entityType'] && this.formInput['entityId'] == null))){
            this.dialogRefr.close(postData);    
        } else {
        if(this.formInput) {
            if(this.formInput['id']) {
                postData['id'] = this.formInput['id'];
                this.configurationService.updateEntityForm(postData).subscribe(res=> {
                    this.formInputUpdatedData.emit(res);
                    this.emitParent('form','update', res);
                });
            } else{
                this.configurationService.saveEntityForm(postData).subscribe(res=> {
                    console.log(res.results)
                    if(res.statusCode == 1) {
                        this.formInputUpdatedData.emit(res);
                        this.emitParent('form','create', res);
                    }
                });
                }
            }
        }
        
    }
    fixClick() {
        console.log('')
    }
 updatePositionsAccurately(): void {
    this.formTemplateObject = this.formTemplateObject.filter(
        (row: any[]) => row.length > 0
    );

        const newFlat: any[] = [];
        this.formTemplateObject.forEach((row, r) => {
        if (row[0]?.type === 'DI-ACD') {
            const acc = row[0];
            acc.position = `R${(r + 1).toString().padStart(2, '0')}C00`;
            (acc.accordionRows || []).forEach((accRow: any[], rowIdx: number) => {
                accRow.forEach((field: any, colIdx: number) => {
                    field.position = `R${(rowIdx + 1).toString().padStart(2, '0')}C${colIdx.toString().padStart(2, '0')}`;
                });
            });
            newFlat.push(acc);
            return;
        }
            row.forEach((field, c) => {
                field.position = `R${(r + 1).toString().padStart(2, '0')}C${c.toString().padStart(2, '0')}`;
                newFlat.push(field);
            });
        });
        this.formTemplateDataObject = [...newFlat.filter((f: any) => f.type !== 'DI-ACD')]
        this.updateLayoutMapping();
        this.updateDataItem()
        this.cdkConnectedLists = this.formTemplateObject.map((_, idx) => 'list' + idx);
    }
    trackByField(index: number, item: any) {
        return item?.id ?? item?.pfFormTemplateDataItemId ?? index;
    }

    private updateConnectedLists(): void {
        const buildLists = () => {
            const listIds = this.formTemplateObject.map((_, idx) => 'list' + idx);
            const gapIds = this.formTemplateObject.map((_, idx) => 'gap-' + idx);
            const accListIds: string[] = [];
            const accGapIds: string[] = [];
            this.formTemplateObject.forEach((fields, idx) => {
                if (fields[0]?.type === 'DI-ACD' && fields[0]?.accordionRows) {
                    fields[0].accordionRows.forEach((_: any, rowI: number) => {
                        accListIds.push('acc-list-' + idx + '-' + rowI);
                        accGapIds.push('acc-gap-' + idx + '-' + rowI);
                    });
                    accGapIds.push('acc-gap-' + idx + '-' + fields[0].accordionRows.length);
                }
            });

             this.cdkConnectedLists = [...listIds, ...gapIds, 'gap-end', ...accListIds, ...accGapIds];
        };
        buildLists();          
        setTimeout(buildLists); 
    }

    onDrop(event: CdkDragDrop<any[]>, destRowIndex: number): void {
        if (this.activeGap !== null) {
            this.onDropInGap(event, this.activeGap);
            return;
        }
        const prevList = event.previousContainer.data;
        const currList = event.container.data;
        const draggedItem = event.item.data;
        if (draggedItem?.type === 'DI-ACD' || currList[0]?.type === 'DI-ACD') {
            const fromIndex = this.formTemplateObject.findIndex(
                (row: any[]) => row[0]?.key === draggedItem?.key
            );
            const toIndex = this.formTemplateObject.findIndex(
                (row: any[]) => row === currList
            );
            if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
                moveItemInArray(this.formTemplateObject, fromIndex, toIndex);
            }
            this.updateConnectedLists();
            this.updatePositionsAccurately();
            return;
        }
        if (currList[0]?.type === 'DI-ACD') {
        const fromIndex = this.formTemplateObject.findIndex(
            (row: any[]) => row === prevList
        );
        const toIndex = this.formTemplateObject.findIndex(
            (row: any[]) => row === currList
        );
        if (fromIndex !== -1 && toIndex !== -1) {
            moveItemInArray(this.formTemplateObject, fromIndex, toIndex);
        }
        this.updateConnectedLists();
        this.updatePositionsAccurately();
        return;
    }
        if (event.previousContainer === event.container) {
            moveItemInArray(currList, event.previousIndex, event.currentIndex);
        } else {
            transferArrayItem(prevList, currList, event.previousIndex, event.currentIndex);
        }
        this.updateConnectedLists();
        this.updatePositionsAccurately();
    }

    onDropInGap(event: CdkDragDrop<any[]>, gapIndex: number): void {
    const draggedItem = event.item.data;
    if (draggedItem?.type === 'DI-ACD') {
        const fromIndex = this.formTemplateObject.findIndex(
            (row: any[]) => row[0]?.key === draggedItem?.key
        );
        if (fromIndex !== -1) {
            this.formTemplateObject = this.formTemplateObject.filter(
                (row: any[]) => row.length > 0
            );
            const adjustedFrom = this.formTemplateObject.findIndex(
                (row: any[]) => row[0]?.key === draggedItem?.key
            );
            const targetIndex = Math.max(0, Math.min(
                gapIndex > adjustedFrom ? gapIndex - 1 : gapIndex,
                this.formTemplateObject.length - 1
            ));
            moveItemInArray(this.formTemplateObject, adjustedFrom, targetIndex);
        }
        this.updateConnectedLists();
        this.updatePositionsAccurately();
        this.activeGap = null;
        return;
    }
        const prevList = event.previousContainer.data;
        const draggedField = prevList[event.previousIndex];
        // const draggedItem = prevList[event.previousIndex];
        prevList.splice(event.previousIndex, 1);

        this.formTemplateObject.splice(gapIndex, 0, [draggedField]);

        this.updateConnectedLists();
        this.updatePositionsAccurately();
        this.activeGap = null;
    }

    private updateLayoutMapping(): void {
        if (!this.formTemplateDataObject) return;

        const newLayout: Record<string, string> = {};

        this.formTemplateObject.forEach((row: any[], r: number) => {
        if (row[0]?.type === 'DI-ACD') {
            const acc = row[0];
            const accKey = acc.key || acc.name;
            if (accKey && acc.position) {
                newLayout[accKey] = acc.position;
            }
            (acc.accordionRows || []).forEach((accRow: any[]) => {
                accRow.forEach((field: any) => {
                    if (field.name && field.position) {
                        newLayout[field.name] = field.position;
                    }
                });
            });
        } else {
            row.forEach((field: any) => {
                if (field.name && field.position) {
                    newLayout[field.name] = field.position;
                }
            });
            }
        });

        this.layout = { ...newLayout };
    }

    onGapEnter(index: number, event: any): void {
        this.activeGap = index;
    }

    onGapExit(index: number, event: any): void {
        if (this.activeGap === index) this.activeGap = null;
    }

    editAccordionTitle(indexi: number) {
        this.data = this.formTemplateObject[indexi][0];
        this.updateIndexi = indexi;
        this.updateIndexj = 0;
        this.isOpen = true
        const dialogRef = this.dialog.open(editFormComponent, {
            data: this.data, panelClass: ['medium-popup'], disableClose: true
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.formTemplateObject[indexi][0] = {
                    ...this.formTemplateObject[indexi][0],
                    ...result,
                    type: 'DI-ACD',
                    key: this.formTemplateObject[indexi][0].key,
                    accordionRows: this.formTemplateObject[indexi][0].accordionRows,
                    accordionTitle: result.labelName,
                    validator: { show: true }
                };
                this.formTemplateObject = [...this.formTemplateObject];
                this.updateDataItem();
            }
            this.exitValue();
        });
    }

    editAccordionField(accordionIndexi: number, accRowI: number, indexj: number) {
        const field = this.formTemplateObject[accordionIndexi][0].accordionRows[accRowI][indexj];
        this.data = field;
        this.updateIndexi = accordionIndexi;
        this.updateIndexj = indexj;
        const dialogRef = this.dialog.open(editFormComponent, {
            data: field, panelClass: ['medium-popup'], disableClose: true
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.formTemplateObject[accordionIndexi][0].accordionRows[accRowI][indexj] = {
                    ...result,
                    key: result.name,
                    validator: result.validation ?
                        { ...JSON.parse(result.validation), show: true } :
                        { show: true }
                };
                this.formTemplateObject = [...this.formTemplateObject];
                this.updateDataItem();
            }
            this.exitValue();
        });
    }

    confirmDeleteAccordionField(accordionIndexi: number, accRowI: number, indexj: number) {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            panelClass: ['confirmation-popup'],
            data: {
                title: 'Confirmation',
                message: 'Are you sure you want to delete this field?',
                buttonText: { ok: 'Yes', cancel: 'No' }
            }
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result == 'Yes') {
                const field = this.formTemplateObject[accordionIndexi][0].accordionRows[accRowI][indexj];
                field.status = false;
                this.formTemplateObject = [...this.formTemplateObject];
                this.updateDataItem();
            }
        });
    }

    activeAccordionIndex: number | null = null;

    setAccordionTarget(indexi: number) {
        const acc = this.formTemplateObject[indexi][0];
        const isAlreadyActive = acc._isActiveTarget;

        this.formTemplateObject.forEach((row: any[]) => {
            if (row[0]?.type === 'DI-ACD') row[0]._isActiveTarget = false;
        });

        if (!isAlreadyActive) {
            acc._isActiveTarget = true;
            this.activeAccordionIndex = indexi;
            this.activeAccordionKey = acc.key;
            this.accordionTargetChanged.emit(acc.key);
        } else {
            this.activeAccordionIndex = null;
            this.activeAccordionKey = null;
            this.accordionTargetChanged.emit(null);
        }

        this.formTemplateObject = [...this.formTemplateObject];
    }


    getAccordionRowConnectedLists(accordionIndexi: number): string[] {
        const acc = this.formTemplateObject[accordionIndexi]?.[0];
        if (!acc || !acc.accordionRows) return [];
        const rowIds = acc.accordionRows.map((_: any, i: number) => `acc-list-${accordionIndexi}-${i}`);
        const gapIds = acc.accordionRows.map((_: any, i: number) => `acc-gap-${accordionIndexi}-${i}`);
        gapIds.push(`acc-gap-${accordionIndexi}-${acc.accordionRows.length}`);
        return [...rowIds, ...gapIds];
    }

    getAccordionGapConnectedLists(accordionIndexi: number): string[] {
        const acc = this.formTemplateObject[accordionIndexi]?.[0];
        if (!acc || !acc.accordionRows) return [];

        const rowIds = acc.accordionRows.map((_: any, i: number) => `acc-list-${accordionIndexi}-${i}`);
        const outerListIds = this.formTemplateObject.map((_, idx) => `list${idx}`);
        const outerGapIds = this.formTemplateObject.map((_, idx) => `gap-${idx}`);  

        return [...rowIds, ...outerListIds, ...outerGapIds];
    }
    onAccordionGapEnter(accordionIndexi: number, gapIndex: number): void {
    this.activeAccordionGap = { accordionIndexi, gapIndex };
}

onAccordionGapExit(accordionIndexi: number, gapIndex: number): void {
    if (this.activeAccordionGap?.accordionIndexi === accordionIndexi &&
        this.activeAccordionGap?.gapIndex === gapIndex) {
        this.activeAccordionGap = null;
    }
}
    onAccordionDrop(event: CdkDragDrop<any[]>, accordionIndexi: number, destRowI: number): void {
        const acc = this.formTemplateObject[accordionIndexi][0];

        if (event.previousContainer === event.container) {
            moveItemInArray(
                event.container.data,
                event.previousIndex,
                event.currentIndex
            );
        } else {
            transferArrayItem(
                event.previousContainer.data,
                event.container.data,
                event.previousIndex,
                event.currentIndex
            );
            acc.accordionRows = acc.accordionRows.filter((row: any[]) => row.length > 0);
        }

        acc.accordionRows.forEach((row: any[], rIdx: number) => {
            row.forEach((field: any, cIdx: number) => {
                field.position = `R${String(rIdx + 1).padStart(2, '0')}C${String(cIdx).padStart(2, '0')}`;
            });
        });

        this.formTemplateObject = [...this.formTemplateObject];
        this.updateConnectedLists(); 
        this.updateDataItem();
    }

    onMainDrop(event: CdkDragDrop<any[]>): void {
        const draggedItem = event.item.data;

        if (draggedItem?.type === 'DI-ACD') {
            const fromIndex = this.formTemplateObject.findIndex(
                (row: any[]) => row[0]?.key === draggedItem?.key
            );
            if (fromIndex !== -1 && event.currentIndex !== fromIndex) {
                moveItemInArray(this.formTemplateObject, fromIndex, event.currentIndex);
                this.updatePositionsAccurately();
            }
        }
        this.updateConnectedLists();
        this.activeGap = null;
    }

   onAccordionGapDrop(event: CdkDragDrop<any>, accordionIndexi: number, gapIndex: number): void {
    const acc = this.formTemplateObject[accordionIndexi][0];
    const draggedField = event.item.data || event.previousContainer.data[event.previousIndex];
    if (!draggedField) return;

    const sourceList = event.previousContainer.data;
    const sourceIdx = sourceList.indexOf(draggedField);
    if (sourceIdx > -1) {
        sourceList.splice(sourceIdx, 1);
    }

    acc.accordionRows = acc.accordionRows.filter((row: any[]) => row.length > 0);

    acc.accordionRows.splice(gapIndex, 0, [draggedField]);

    acc.accordionRows.forEach((row: any[], rIdx: number) => {
        row.forEach((field: any, cIdx: number) => {
            field.position = `R${String(rIdx + 1).padStart(2, '0')}C${String(cIdx).padStart(2, '0')}`;
        });
    });

    this.formTemplateObject = [...this.formTemplateObject];
    this.activeAccordionGap = null;
    this.updateConnectedLists();
    this.updateDataItem();
}
private ensureTempCustomCss(field: any): void {
    if (!field.tempCustomCss) {
    field.tempCustomCss = { content: null, di: null };
    if (typeof field.customCss === 'string') {
        try {
            const customCss = JSON.parse(field.customCss);
            field.tempCustomCss = customCss.hasOwnProperty('di') 
                ? customCss 
                : { content: null, di: customCss };
            } catch(e) {}
        }
    }

    if (field.outputResponse == null && typeof field.customValue === 'string' && field.customValue) {
        try {
            field.outputResponse = JSON.parse(field.customValue);
        } catch(e) {}
    }

    if (!field.dataBind) {
        field.dataBind = { key: 'code', value: 'value' };
        try {
            if (typeof field.validation === 'string' && field.validation) {
                const validationJson = JSON.parse(field.validation);
                if (validationJson.hasOwnProperty('dataBind')) {
                    field.dataBind = validationJson['dataBind'];
                }
            }
        } catch(e) {}
    }
}
}

@Component({
    selector: 'app-edit-form-component',
    templateUrl: './edit-form.component.html',
    styleUrls: ['./form.component.scss']
})
export class editFormComponent implements OnInit{
    public formDataItem: FormGroup;
    public labelName = "Edit Form";
    public dataItemFields = ['defaultValue','labelName','name','position','customCss','multiSelect','tooltip','contextValue','customValue','validation'];
    public levelList = [{code: 0, value:'Level 0'}, {code: 1, value:'Level 1'}, {code: 2, value:'Level 2'}, {code: 3, value:'Level 3'}, {code: 4, value:'Level 4'}, {code: 5, value:'Level 5'}, {code: 6, value:'Level 6'},{code: 7, value:'Level 7'}, {code: 8, value:'Level 8'},{code: 9, value:'Level 9'}, {code: 10, value:'Level 10'}];
    public enableForm = false;
    public fieldType = 'DI-TXT';
    public defaultDate =['CurrentDate','Blank'];
    public options = [true,false];
    public today = this.datepipe.transform(new Date(), 'yyyy-MM-dd');
    public formFieldData : any =  null;
    public modelList: any = [];
    public modelSearch = new FormControl('');
    public filteredModelSearch: any[] = [];
    public dataItemTypes : any;
    public loading: boolean = false;
    public selectedModel: any = null;
    validationData: any = { required: false, outline: true, disabled: false, documentVerify: false};
    @Output() dataValue = new EventEmitter();
    @Output() exitValue = new EventEmitter();
    constructor(public datepipe: DatePipe,public form: FormBuilder,@Inject(MAT_DIALOG_DATA) public data: any,private readonly dialogRef: MatDialogRef<editFormComponent>,
     public dashboardService: DashboardService,public commonService: CommonService, public configurationService: ConfigurationService, public toastr: AppToastService,
     public dialog: MatDialog){
        if (this.data?.id) {
            this.formFieldData = this.data;
            this.selectedModel = this.data?.pfModelData ?? null;
        }
    }
    ngOnInit(): void {        
        this.buildform();
        if (this.formFieldData) {
            if (this.formFieldData.hasOwnProperty('verifyDocument')) {
                this.validationData = { ...JSON.parse(this.formFieldData.validation), documentVerify: this.formFieldData?.verifyDocument };
            } else {
                this.validationData = JSON.parse(this.formFieldData.validation);
            }
            let apvlevelList = [];
            let hintMessagedata = [];
             if (this.validationData.hasOwnProperty('approvalLevel')) {
                apvlevelList = [this.validationData['approvalLevel']];
                this.formDataItem.get('approvalLevel').setValue(this.validationData['approvalLevel']);
                delete this.validationData['approvalLevel'];
             }
             if (this.validationData.hasOwnProperty('hint')) {
                hintMessagedata = [this.validationData['hint']];
                this.formDataItem.get('hint').setValue(this.validationData['hint']);
                delete this.validationData['hint'];
             }
            this.labelName = this.formFieldData['labelName'];
            this.fieldType = this.formFieldData['type'];
            if (this.formFieldData.hasOwnProperty('formStatusData')) {
                const statusLevels = this.formFieldData?.formStatusData?.map(x => x.level);
                apvlevelList.push(...statusLevels);
                apvlevelList = [...new Set(apvlevelList)];
            }
            this.levelList = this.levelList.filter(res => apvlevelList.includes(res.code));  
        }
        this.commonService.getAppTerms('DataItemType').subscribe(res => {
            this.dataItemTypes = res.results.filter(resFilter => resFilter.groupName === 'DataItemType');
        });
 
        this.getmodel();      
    }

    getmodel(){
        this.loading = true;
        this.dashboardService.getAllModals().subscribe(res => {
            this.loading = false;
            if (res.statusCode === 1) {
                this.modelList = res.results || [];
                this.filteredModelSearch = [...this.modelList];  
                this.modelSearch.valueChanges.subscribe(searchText => {
                    const lower = (searchText || '').toLowerCase();
                    this.filteredModelSearch = this.modelList.filter(model =>
                        model.name?.toLowerCase().includes(lower)
                        
                    );
                });
            }
        });
    }
    modelInputData(model) {
        if (model) {
            this.selectedModel = model;
            this.formDataItem.controls['modelTypeName'].setValue(model.modelTypeName);
            this.formDataItem.controls['modelInput'].setValue(model.inputParams);
            this.formDataItem.controls['modelOutput'].setValue(model.outputParams);
            this.formDataItem.controls['entity'].setValue(model.entity);
            this.formDataItem.controls['entityTable'].setValue(model.entityTable);
            this.formDataItem.controls['entityColumn'].setValue(model.entityColumn);
            this.formDataItem.controls['targetDb'].setValue(model.targetDb);
            this.formDataItem.controls['queryString'].setValue(model.queryString);
        }
    }

    onFilterSearchOpened(opened) {
        if (opened) {
            this.filteredModelSearch = this.modelList;
        }
    }

    onCheckboxChange(value, event) {
        const eventData = event.checked;
        if (this.validationData.hasOwnProperty(value.key)) {
            this.validationData[value.key] = eventData;
        }
    }

    buildform(){
    this.formDataItem = this.form.group({
     defaultValue: [this.formFieldData?.defaultValue ? this.formFieldData.defaultValue : null],   
     labelName: [this.formFieldData?.labelName ? this.formFieldData.labelName : null, Validators.required],
     name: [this.formFieldData?.name ? this.formFieldData.name : null,[ Validators.required, Validators.pattern("^[A-Za-z]+$")]],
     type: [this.formFieldData?.type ? this.formFieldData.type : null, Validators.required],
     position: [this.formFieldData?.position ? this.formFieldData.position : null],
     customCss: [this.formFieldData?.customCss ? this.formFieldData.customCss : null],
     tooltip: [this.formFieldData?.tooltip ? this.formFieldData.tooltip : null],
     contextValue: [this.formFieldData?.contextValue ? this.formFieldData.contextValue : null],
     multiSelect: [this.formFieldData?.multiSelect ? this.formFieldData.multiSelect : null],
     customValue: [this.formFieldData?.customValue ? this.formFieldData.customValue : null],
     validation: [this.formFieldData?.validation ? this.formFieldData.validation : null],
     modelid: [this.formFieldData?.pfModelData?.id ? this.formFieldData.pfModelData?.id : null],
     modelInput: [this.formFieldData?.pfModelData?.inputParams ? this.formFieldData.pfModelData?.inputParams : null],
     modelOutput: [this.formFieldData?.pfModelData?.outputParams ? this.formFieldData.pfModelData?.outputParams : null],
     description: [this.formFieldData?.description ? this.formFieldData.description : null],
     customErrorMessage: [this.formFieldData?.customErrorMessage ? this.formFieldData.customErrorMessage : null],
     modelTypeName: [this.formFieldData?.pfModelData?.modelTypeName ? this.formFieldData.pfModelData?.modelTypeName : null],
     entity: [this.formFieldData?.pfModelData?.entity ? this.formFieldData.pfModelData?.entity : null],
     entityTable: [this.formFieldData?.pfModelData?.entityTable ? this.formFieldData?.pfModelData?.entityTable : null],
     entityColumn: [this.formFieldData?.pfModelData?.entityColumn ? this.formFieldData?.pfModelData?.entityColumn : null],
     approvalLevel: [null],
     hint: [null],
     modelMapping: [this.formFieldData?.modelMapping ? JSON.stringify(this.formFieldData.modelMapping) : null],
     template: [this.formFieldData?.template ? JSON.stringify(this.formFieldData.template) : null],
     targetDb: [this.formFieldData?.pfModelData?.targetDb ? this.formFieldData.pfModelData?.targetDb : null],
     queryString: [this.formFieldData?.pfModelData?.queryString ? this.formFieldData.pfModelData?.queryString : null],
     verifyDocument: [this.formFieldData?.verifyDocument ?? false]
    })
  }

    public saveDataItemValidation(){
        let validationData = {
            approvalLevel: this.formDataItem.get('approvalLevel')?.value,
            hint: this.formDataItem.get('hint')?.value,
            ...this.validationData
        };
        const { documentVerify, ...finalValidationData } = validationData;
        this.formDataItem.get('verifyDocument').setValue(documentVerify);
        validationData = finalValidationData;
        
        this.formDataItem.controls['validation'].setValue(JSON.stringify(validationData));
        this.formDataItem.removeControl('hint');
        this.formDataItem.removeControl('approvalLevel');
        let jsonObj = this.formDataItem.value;
        if (jsonObj && this.formFieldData) {
            this.formFieldData['pfModelId'] = jsonObj['modelid'] ?? null;
            // this.formFieldData.pfModelData['id'] = jsonObj['modelid'] ?? null;
            // this.formFieldData.pfModelData['inputParams'] = jsonObj['modelInput'] ?? null;
            // this.formFieldData.pfModelData['modelTypeName'] = jsonObj['modelTypeName'] ?? null;
            // this.formFieldData.pfModelData['entity'] = jsonObj['entity'] ?? null;
            // this.formFieldData.pfModelData['entityTable'] = jsonObj['entityTable'] ?? null;
            // this.formFieldData.pfModelData['entityColumn'] = jsonObj['entityColumn'] ?? null;            
        }

        for(let i=0;i<this.dataItemFields.length;i++){
            if(this.dataItemFields[i] == 'defaultValue'){
                if(this.formFieldData['type']=='DI-DTE'){
                    if(jsonObj['defaultValue'] == "CurrentDate"){
                        this.formFieldData['defaultValue'] = new Date();
                    }else{
                        this.formFieldData['defaultValue'] = jsonObj['defaultValue'];
                    }
                }else{
                    this.formFieldData['defaultValue'] = jsonObj['defaultValue'];
                }
            } else if(this.dataItemFields[i] == 'position'){
                if(jsonObj[this.dataItemFields[i]] == ""){
                    this.formFieldData[this.dataItemFields[i]] = null;
                } else{
                    this.formFieldData[this.dataItemFields[i]] = jsonObj[this.dataItemFields[i]];
                }
            } else{
                this.formFieldData[this.dataItemFields[i]] = jsonObj[this.dataItemFields[i]];
            }
            if(this.dataItemFields[i] == 'name'){
                this.formFieldData['key'] = jsonObj[this.dataItemFields[i]];
            }
            delete jsonObj[this.dataItemFields[i]];
        }

        if (this.data?.viewTypeId != 'TW-FDI') {
            this.dialogRef.close(this.formFieldData)
        } else {
            this.saveDataitem();
        }
    }

    saveDataitem(){
        const dataItemInfo = {
            "customCss": this.formDataItem.get('customCss').value ?? null,
            "customErrorMessage": this.formDataItem.get('customErrorMessage').value ?? null,
            "customValue": this.formDataItem.get('customValue').value ?? null,
            "defaultValue": this.formDataItem.get('defaultValue').value ?? null,
            "description": this.formDataItem.get('description').value ?? null,
            "id": this.data.id ?? null,
            "isFacility": true,
            "isMultiSelect": true,
            "labelName": this.formDataItem.get('labelName').value ?? null,
            "modelInput": this.formDataItem.get('modelInput').value ?? null,
            "modelMapping": this.formDataItem.get('modelMapping').value ? JSON.parse(this.formDataItem.get('modelMapping').value) : null,
            "template": this.formDataItem.get('template').value ? JSON.parse(this.formDataItem.get('template').value) : null,
            "name": this.formDataItem.get('name').value ?? null,
            "pfModelId": this.formDataItem.get('modelid').value ?? null,
            "status": this.data.status ?? true,
            "tooltip": this.formDataItem.get('tooltip').value ?? null,
            "type": this.formDataItem.get('type').value ?? null,
            "validation": JSON.stringify(this.validationData) ?? null,
            "verifyDocument": this.formDataItem.get('verifyDocument').value ?? null
        }
        // console.log(dataItemInfo)
        // return
        this.configurationService.saveDataitems(dataItemInfo).subscribe(res =>{
            if(res.statusCode === 1){
                this.toastr.success('Success', `${res.message}`);
                this.dialogRef.close('confirm');
            }
        });
      }    

    public exitPopup(){
        this.dialogRef.close()
    }


    addModel() {
        const dialogRef = this.dialog.open(PfModelsEditinfoComponent, {
            data: null, panelClass: ['medium-popup'], disableClose: true
        });
        dialogRef.afterClosed().subscribe(() => {
            this.getmodel();
        });
    }

    fixClick() {
        console.log('')
    }
}

@Component({
    selector: 'app-table-update',
    templateUrl: './table-update.component.html',
    styleUrls: ['./form.component.scss']
})
export class tableUpdateComponent {
    selectedOptions = [];
    formTemplateData = [];
    public edit=new FormControl();
    public delete=new FormControl();
    excludeValues = ['DI-BTN','DI-HZL','DI-LBL','DI-TABLE']
    constructor(@Inject(MAT_DIALOG_DATA) public data: any,@Optional()  private readonly dialogRef: MatDialogRef<tableUpdateComponent>,public dialog: MatDialog,public toastr:AppToastService){
        this.formTemplateData = this.data['formTemplateData'].filter(res => !this.excludeValues.includes(res.type))
        if(!this.formTemplateData.length){
            this.toastr.warning('Warning', 'Please Add Input Fields to Form');
            this.dialogRef.close('confirm');
        }
        if(this.data['contextValue'] && this.formTemplateData.length){
            this.data['contextValue'] = JSON.parse(this.data['contextValue']);
            if(this.data['contextValue'].hasOwnProperty('name')){
                this.selectedOptions = this.formTemplateData.filter(res => this.data['contextValue']['name'].includes(res.name));
            }
            if(this.data['contextValue'].hasOwnProperty('action')){
                this.edit.setValue(this.data['contextValue']['action']['edit'])
                this.delete.setValue(this.data['contextValue']['action']['delete'])
            }
        }
    }


    selectedColumns(){
        let dataToReturn = {
            "selectedOption":this.selectedOptions,
            "edit": this.edit.value,
            "delete":this.delete.value
        }
        this.dialogRef.close(dataToReturn);
    }
    toggleSelection(item: any) {
        const index = this.selectedOptions.indexOf(item);
        if (index > -1) {
          this.selectedOptions.splice(index, 1);
        } else {
          this.selectedOptions.push(item);
        }
      }
    fixClick() {
        console.log('')
    }
}
