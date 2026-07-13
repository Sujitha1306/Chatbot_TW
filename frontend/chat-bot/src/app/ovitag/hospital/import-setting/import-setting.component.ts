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
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HospitalService, CommonService, ConfigurationService, WorkflowService } from '../../../shared';
import { MatTableDataSource } from '@angular/material/table';
import { routerTransition } from '../../../router.animations';
import { DatePipe } from '@angular/common';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import * as ExcelJS from "exceljs/dist/exceljs.min.js";
import { AppToastService } from '../../../shared/services/toaster.service';
import { LookupTermService } from '../../../shared/lookup-term.service';
@Component({
  selector: 'app-import-setting',
  templateUrl: './import-setting.component.html',
  styleUrls: ['./import-setting.component.scss'],
  providers: [DatePipe],
  animations: [routerTransition()]
})
export class ImportSettingComponent {
  public activate_btn: any = [];
  dataSource: MatTableDataSource<any>;
  public jsonData: any;
  public maintenanceData : any;
  public errorData: any;
  public roleList:any = {};
  assetTypeList: any;
  departmentList: any;
  userNameList: any;
  costTypeList:any;
  assetCategoryList:any;
  testCategoryList: any;
  healthTestGroupList: any;
  assetType: any;
  locationList: any;
  maintenanceList:any;
  frequencyList:any;
  readerHardwareTypeList : any;
  readerTypeList : any;
  readerConnectivityTypeList: any;
  readerVersion:any;
  doctorList:any;
  surgeryList:any;
  totalRecords:number;
  public loading = false;
  defaultAssetStatus = null;
  constructor(public hospitalService: HospitalService, public toastr: AppToastService, public workflowService:WorkflowService,public readonly lookupTermService: LookupTermService,
    public dialog: MatDialog, public snackbar: MatSnackBar, public commonService: CommonService,private readonly configurationServices:ConfigurationService, private readonly _dateFormat: DatePipe) {
    this.activate_btn = this.commonService.getActivePermission('button');
  }

  employeeImport(event) {
    this.loading=true;
    const file= event.target.files[0];     
      let fileReader = new FileReader();    
      fileReader.readAsArrayBuffer(file);     
      fileReader.onload = (e) => {    
          const arrayBuffer:any = fileReader.result;    
          let data = new Uint8Array(arrayBuffer);    
          let arr = new Array();    
          for(let i = 0; i < data.length; ++i) arr[i] = String.fromCharCode(data[i]);    
          let bstr = arr.join("");    
          let workbook = XLSX.read(bstr, {type:"binary", cellText:false, cellDates:true});    
          let first_sheet_name = workbook.SheetNames[0];    
          let worksheet = workbook.Sheets[first_sheet_name];    
          let arraylist = XLSX.utils.sheet_to_json(worksheet,{raw:false, defval:null, dateNF: 'yyyy-MM-dd;@'});     
          const filelist = [worksheet.A1,worksheet.B1,worksheet.C1,worksheet.D1,worksheet.E1,worksheet.F1,worksheet.G1,worksheet.H1,worksheet.I1,worksheet.J1];  
          const header = ['firstName', 'mainidentifier', 'email', 'managerId', 'gender', 'mobileNo', 'birthDate', 'joinDate', 'countryCode', 'empTagId'];
        for (let headers = 0 ; headers < header.length ; headers++) {
          const str = header[headers];
          if (filelist[headers].v !== str) {
            this.snackbar.open(`Invalid column headers.. Please check the file`, 'Close', {
              duration: 3000,
            });
            this.loading=false;
            event.target.value = null;
            return false;
          }
        }   
      this.jsonData = arraylist;
      for (const m in this.jsonData) {
        if (this.jsonData[m]['countryCode'] !== '') {
          this.jsonData[m]['countryCode'] = '+' + this.jsonData[m]['countryCode'];
        }

        if (this.jsonData[m]['firstName'] !== '') {
          this.jsonData[m]['firstName'] = this.jsonData[m]['firstName'].trim();
        }

        if (this.jsonData[m]['email'] !== '') {
          this.jsonData[m]['email'] = this.jsonData[m]['email'].trim();
        }

        if (this.jsonData[m]['empTagId'] !== '') {
          this.jsonData[m]['tagId'] = [this.jsonData[m]['empTagId']];
        } else {
          this.jsonData[m]['tagId'] = null;
        }
      }
      this.loading=false;
      event.target.value = null;
      if (this.jsonData) {
        this.hospitalService.importBulkEmployee(this.jsonData).subscribe(res => {
          this.toastr.success('Success', `${res.results.note}`);
        }, error => {
          this.toastr.error('Error', `${error.error.message}`);
        });
      }
    };
  }

async downloadAsset() {
  this.loading = true;
  const termListExists = await this.assetTermsListExist();
  const headers = termListExists
  ? ['assetSerialNumber','majorType','minorType','assetCategory', 'assetName', 'assetType', 'ownerDepartment', 'owner','assignedDepartment', 'assetUser','serviceCountryCode', 'serviceContact', 'servicePersonEmail', 'costType','manufacturer', 'assetCost', 'vendorName', 'modelNo', 'productSerialNo', 'serviceProviderName','vendorCountryCode', 'vendorContact', 'vendorEmail', 'poDate','criticality', 'softwareVersion', 'usefulLife', 'depreciationPercent', 'depreciationType', 'description' , 'locationName','bioMedTag','oracleId','oracleDescription','sfdaNo','commissionOn','warrantyPeriod','periodType','assetStatus']
  : ['assetSerialNumber','assetCategory', 'assetName', 'assetType', 'ownerDepartment', 'owner','assignedDepartment', 'assetUser','serviceCountryCode', 'serviceContact', 'servicePersonEmail', 'costType','manufacturer', 'assetCost', 'vendorName', 'modelNo', 'productSerialNo', 'serviceProviderName','vendorCountryCode', 'vendorContact', 'vendorEmail', 'poDate','criticality', 'softwareVersion', 'usefulLife', 'depreciationPercent', 'depreciationType', 'description' , 'locationName','bioMedTag','oracleId','oracleDescription','sfdaNo','commissionOn','warrantyPeriod','periodType','assetStatus'];
  const mandatoryFields = ['assetName','assetSerialNumber'];
  const contactFields = ['serviceContact', 'vendorContact'];
  const dateFields = ['commissionOn', 'poDate'];
  const emailFields = ['servicePersonEmail', 'vendorEmail'];
  const numberFields = ['assetCost', 'softwareVersion','warrantyPeriod'];
  const percentageFields = ['depreciationPercent'];
  const workbook = new ExcelJS.Workbook();
  const mainSheet = workbook.addWorksheet('Sheet1');
  const apiSheet = workbook.addWorksheet('Sheet2');

  const headerRow = mainSheet.addRow(headers);
  headers.forEach((header, index) => {
      mainSheet.getColumn(index + 1).width = 30;
      if (mandatoryFields.includes(header)) {
        headerRow.getCell(index + 1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFCCCB' }, // Light red fill
        };
      }
  });

  let departmentList = [], userNameList = [], assetTypeList = [], costTypeList = [],assetStatusList = [],
    assetCategory = [], depreciationType = [], criticality = [], locationList =[], countryCodeList =[];
    let periodType =['Month','Year']
    let usefulLife = Array.from({ length: 15 }, (_, i) => String(i + 1));

  const apiPromises = [
      this.configurationServices.getAssetDepartment().toPromise().then(res => departmentList = res.results.map(r => r.name) || []),
      this.configurationServices.getTicketUser('', 'RT-US').toPromise().then(res => userNameList = res.results.map(r => r.name) || []),
      this.lookupTermService.getAppTermsWrapper('AssetType').toPromise().then(res => assetTypeList = res.AssetType.map(r => r.value) || []),
      this.lookupTermService.getAppTermsWrapper('CostType').toPromise().then(res => costTypeList = res.CostType.map(r => r.value) || []),
      this.commonService.getAppTermsVerion2('AssetCategory').toPromise().then(res => assetCategory = res.results.map(r => r.value) || []),
      this.lookupTermService.getAppTermsWrapper('DepreciationType').toPromise().then(res => depreciationType = res.DepreciationType.map(r => r.value) || []),
      this.lookupTermService.getAppTermsWrapper('Criticality').toPromise().then(res => criticality = res.Criticality.map(r => r.value) || []),
      this.commonService.getAllLocationList(null,null,'3,17','Active',null,null,null).toPromise().then(res => locationList = res.results.map(r => r.fullName) || []),
      this.lookupTermService.getAppTermsWrapper('CountryCode').toPromise().then(res=> countryCodeList = res.CountryCode.map(r=>r.code)),
      this.lookupTermService.getAppTermsWrapper('AssetStatus').toPromise().then(res=> assetStatusList = res.AssetStatus.map(r=>r.value))
  ];

  Promise.all(apiPromises)
  .then(() => {
      return this.configurationServices.getConfigFile('excel-config').toPromise();
  })
  .then(res => {
    this.totalRecords = res?.results?.contentObject?.createAsset ? res.results.contentObject.createAsset + 1 : 1001;

      const dataLists = {
          assetType: assetTypeList,
          ownerDepartment: departmentList,
          assignedDepartment: departmentList,
          owner: userNameList,
          assetUser: userNameList,
          costType: costTypeList,
          assetCategory: assetCategory,
          majorType:assetCategory,
          minorType:assetCategory,
          depreciationType: depreciationType,
          usefulLife: usefulLife,
          criticality: criticality,
          locationName: locationList,
          vendorCountryCode : countryCodeList,
          serviceCountryCode : countryCodeList,
          periodType: periodType,
          assetStatus : assetStatusList
      };

      Object.entries(dataLists).forEach(([key, list], index) => {
          const col = index + 1;
          apiSheet.getColumn(col).values = [key, ...list];
          apiSheet.getColumn(col).width = 30;
      });

      apiSheet.protect('twDevEx$123', {
        selectLockedCells: true,
        selectUnlockedCells: true,
        formatCells: false,
        formatColumns: false,
        formatRows: false,
        insertColumns: false,
        insertRows: false,
        insertHyperlinks: false,
        deleteColumns: false,
        deleteRows: false,
        sort: false,
        autoFilter: false,
        pivotTables: false
      });
      headers.forEach((header, colIndex) => {
          const listColIndex = Object.keys(dataLists).indexOf(header) + 1;
          const colLetter = this.getColumnLetter(listColIndex);
          const listLength = dataLists[header]?.length || 0;
          const rangeAddress = `'${apiSheet.name}'!$${colLetter}$2:$${colLetter}$${listLength + 1}`;

          for (let rowIndex = 2; rowIndex <= this.totalRecords; rowIndex++) {
            const cell = mainSheet.getCell(rowIndex, colIndex + 1);
            const ref = cell.address;

          const validationType = (() => {
            if (dataLists[header]) return 'dropdown';
            if (dateFields.includes(header)) return 'date';
            if (contactFields.includes(header)) return 'contact';
            if (emailFields.includes(header)) return 'email';
            if (numberFields.includes(header)) return 'number';
            if (percentageFields.includes(header)) return 'percentage';
            return null;
          })();

          const validationMap = {
            dropdown: {
              type: 'list',
              allowBlank: true,
              formulae: [rangeAddress],
              showErrorMessage: true,
              errorStyle: 'error',
              errorTitle: 'Invalid Input',
              error: 'Value must be from the list',
            },
            date: {
              type: 'date',
              operator: 'greaterThan',
              formulae: ['DATE(1900,1,1)'],
              allowBlank: true,
              showErrorMessage: true,
              errorStyle: 'stop',
              errorTitle: 'Invalid Date',
              error: 'Enter a valid date (dd-MM-yyyy)',
            },
            contact: {
              type: 'custom',
              allowBlank: true,
              formulae: [`OR(${ref}="",AND(ISNUMBER(VALUE(${ref})),LEN(${ref})>=9,LEN(${ref})<=15,ISERROR(FIND(".",${ref}))))`],
              showErrorMessage: true,
              errorStyle: 'stop',
              errorTitle: 'Invalid Contact Number',
              error: 'Enter a valid Contact Number.',
            },
            email: {
              type: 'custom',
              allowBlank: true,
              formulae: [
                `OR(${ref}="",AND(ISNUMBER(FIND("@",${ref})),ISNUMBER(FIND(".",${ref})),LEN(${ref})-LEN(SUBSTITUTE(${ref},"@",""))=1))`
              ],
              showErrorMessage: true,
              errorStyle: 'stop',
              errorTitle: 'Invalid Email',
              error: 'Enter a valid email address',
            },
            number: {
              type: 'custom',
              allowBlank: true,
              formulae: [`OR(${ref}="",AND(ISNUMBER(${ref}),INT(${ref})=${ref}))`],
              showErrorMessage: true,
              errorStyle: 'stop',
              errorTitle: 'Invalid Number Format',
              error: 'Enter a Valid Number',
            },
            percentage: {
              type: 'decimal',
              operator: 'between',
              formulae: [0, 100],
              allowBlank: true,
              showErrorMessage: true,
              errorStyle: 'stop',
              errorTitle: 'Invalid Percentage',
              error: 'Enter a valid percentage between 0 and 100.',
            },
          };

          if (validationType && validationMap[validationType]) {
            cell.dataValidation = validationMap[validationType];
          }
        }
      });


      const TextCols = ['modelNo', 'productSerialNo', 'serviceContact', 'vendorContact'];
      TextCols.forEach(header => {
        const col = headers.indexOf(header) + 1;
        for (let row = 2; row <= this.totalRecords; row++) {
          mainSheet.getCell(row, col).numFmt = '@';
        }
      });

      return workbook.xlsx.writeBuffer();
  })
  .then(buffer => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      this.loading=false;
      saveAs(blob, 'download-asset.xlsx');
  })
}


async assetImport(event) {
  this.loading = true;
  const termListExists = await this.assetTermsListExist();
  try {
    const [assetTypeRes, departmentRes, userRes, costTypeRes,assetCategoryRes,depreciationTypeRes, criticalityRes,locationListres,assetStatus] = await
    Promise.all([
        this.lookupTermService.getAppTermsWrapper('AssetType').toPromise(),
        this.configurationServices.getAssetDepartment().toPromise(),
        this.configurationServices.getTicketUser('', 'RT-US').toPromise(),
        this.lookupTermService.getAppTermsWrapper('CostType').toPromise(),
        this.commonService.getAppTermsVerion2('AssetCategory').toPromise(),
        this.lookupTermService.getAppTermsWrapper('DepreciationType').toPromise(),
        this.lookupTermService.getAppTermsWrapper('Criticality').toPromise(),
        this.commonService.getAllLocationList(null,null,'3,17','Active',null,null,null).toPromise(),
         this.lookupTermService.getAppTermsWrapper('AssetStatus').toPromise()
    ])
    this.assetTypeList = assetTypeRes.AssetType.map(({ code, value }) => ({ code, value }));
    this.departmentList = departmentRes.results.map(({ id, name }) => ({ id, name }));
    this.userNameList = userRes.results.map(({ id, name }) => ({ id, name }));
    this.costTypeList = costTypeRes.CostType.map(({ code, value }) => ({ code, value }));
    this.assetCategoryList = assetCategoryRes.results.map(({ code, value }) => ({ code, value }));
    const depreciationTypeList = depreciationTypeRes.DepreciationType.map(({ code, value }) => ({ code, value }));
    const criticalityList = criticalityRes.Criticality.map(({ code, value }) => ({ code, value }));
    const locationList = locationListres.results.map(({id,fullName}) =>({ id,fullName}))
    let periodType =[{code:'M',value:'Month'},{code:'Y',value:'Year'}]
    const assetStatusList = assetStatus.AssetStatus.map(({ code, value }) => ({ code, value }));
    const file = event.target.files[0];
    if (!file) {
      this.loading = false;
      return;
    }
    const arrayBuffer: ArrayBuffer = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
    const workbook = XLSX.read(arrayBuffer, { type: "array", cellText: false, cellDates: true });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const headerRow = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0]  as string[];
    const header = termListExists
    ? ['assetSerialNumber','majorType','minorType','assetCategory', 'assetName', 'assetType', 'ownerDepartment', 'owner','assignedDepartment', 'assetUser','serviceCountryCode', 'serviceContact', 'servicePersonEmail', 'costType','manufacturer', 'assetCost', 'vendorName', 'modelNo', 'productSerialNo', 'serviceProviderName','vendorCountryCode', 'vendorContact', 'vendorEmail', 'poDate','criticality', 'softwareVersion', 'usefulLife', 'depreciationPercent', 'depreciationType', 'description' , 'locationName','bioMedTag','oracleId','oracleDescription','sfdaNo','commissionOn','warrantyPeriod','periodType','assetStatus']
    : ['assetSerialNumber','assetCategory', 'assetName', 'assetType', 'ownerDepartment', 'owner','assignedDepartment', 'assetUser','serviceCountryCode', 'serviceContact', 'servicePersonEmail', 'costType','manufacturer', 'assetCost', 'vendorName', 'modelNo', 'productSerialNo', 'serviceProviderName','vendorCountryCode', 'vendorContact', 'vendorEmail', 'poDate','criticality', 'softwareVersion', 'usefulLife', 'depreciationPercent', 'depreciationType', 'description' , 'locationName','bioMedTag','oracleId','oracleDescription','sfdaNo','commissionOn','warrantyPeriod','periodType','assetStatus'];
    const normalizedHeaderRow = headerRow.map(h => (h ?? '').toString().trim());
    const normalizedHeader = header.map(h => h.trim());

    if (
      normalizedHeaderRow.length !== normalizedHeader.length ||
      normalizedHeaderRow.some((val, idx) => val !== normalizedHeader[idx])
    ) {
      this.toastr.warning('Warning','Invalid column headers.. Please check the file');
      this.loading = false;
      event.target.value = null; 
      return;
    }
    const arrayList = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: null, dateNF: 'yyyy-MM-dd;@', rawNumbers: false});
    const jsonData = arrayList.map(row => {
    const type = this.mapAppTermField(row['periodType'], periodType, 'code', 'value');
    const period = Number(row['warrantyPeriod']);
    const isValidWarranty = period > 0 && type &&(row['commissionOn']!= null || row ['commissionOn'] != undefined || row['commissionedOn'] != '');
    const baseData: any = {
      assetTypeId: this.mapAppTermField(row['assetType'], this.assetTypeList),
      ownerDepartmentId: this.mapAppTermField(row['ownerDepartment'], this.departmentList, 'id', 'name'),
      assignedDepartmentId: this.mapAppTermField(row['assignedDepartment'], this.departmentList, 'id', 'name'),
      ownerId: this.mapAppTermField(row['owner'], this.userNameList, 'id', 'name'),
      assetUserId: this.mapAppTermField(row['assetUser'], this.userNameList, 'id', 'name'),
      costTypeId: this.mapAppTermField(row['costType'], this.costTypeList),
      modelId: row['modelNo'] ? this.formatNumberAsString(row['modelNo']) : null,
      productSerialNumber: row['productSerialNo'] ? this.formatNumberAsString(row['productSerialNo']) : null,
      assetName: row['assetName'] || null,
      assetSerialNumber: row['assetSerialNumber'] ? this.formatNumberAsString(row['assetSerialNumber']) : null,
      servicePersonEmail: row['servicePersonEmail'] || null,
      manufacturer: row['manufacturer'] || null,
      commissionedOn: this.parseDate(row['commissionOn'] ),
      assetCost: row['assetCost'] && !isNaN(parseFloat(row['assetCost'])) ? parseFloat(row['assetCost']).toFixed(2) : null,
      vendorName: row['vendorName'] || null,
      tagSerialNumber: row['tagSerialNumber'] ? this.formatNumberAsString(row['tagSerialNumber']) : null,
      serviceProviderName: row['serviceProviderName'] || null,
      vendorEmail: row['vendorEmail'] || null,
      poDate: this.parseDate(row['poDate']),
      criticalityId: this.mapAppTermField(row['criticality'], criticalityList),
      softwareVersion: row['softwareVersion'] || null,
      usefulLife: row['usefulLife'] || null,
      depreciationPercent: row['depreciationPercent'] && !isNaN(parseFloat(row['depreciationPercent'])) ? parseFloat(row['depreciationPercent']) : null,
      depreciationTypeId: this.mapAppTermField(row['depreciationType'], depreciationTypeList),
      comments : row['description'] || null,
      locationId : this.mapAppTermField(row['locationName'], locationList,'id','fullName'),
      assetStatus: this.mapAppTermField(row['assetStatus'],assetStatusList) ?? this.defaultAssetStatus,
      serviceContact: this.formatContactNumber(row['serviceCountryCode'], row['serviceContact']),
      vendorContact: this.formatContactNumber(row['vendorCountryCode'], row['vendorContact']),
      biomedTagId: row['bioMedTag']? this.formatNumberAsString(row['bioMedTag']): null,
      oracleId: row['oracleId']? this.formatNumberAsString(row['oracleId']): null,
      oracleDescription: row['oracleDescription']? row['oracleDescription']: null,
      sfda: row['sfdaNo']? this.formatNumberAsString(row['sfdaNo']): null,
      warrantyPeriod: isValidWarranty ? this.formatWarrantyPeriod(period, type): null,
      warrantyDue: isValidWarranty? this.calculateEndDate(row['commissionOn'], period, type): null
    }

    if (termListExists) {
      baseData.assetCategoryId = this.mapAppTermField(row['majorType'], this.assetCategoryList);
      baseData.assetCategory1Id = this.mapAppTermField(row['minorType'], this.assetCategoryList);
      baseData.assetCategory2Id = this.mapAppTermField(row['assetCategory'], this.assetCategoryList);
    } else {
      baseData.assetCategoryId = this.mapAppTermField(row['assetCategory'], this.assetCategoryList);
    }
    return baseData;
  }).filter(entry => Object.keys(entry).length > 0);

    this.loading = false;
    event.target.value = null;
    if (!jsonData.length) {
      this.toastr.warning('Warning', 'Invalid data for Import. Please check the file');
      return;
    }
    this.hospitalService.importBulkAsset(jsonData).subscribe(
      res => {
        this.toastr.success('Success', `${res.message}`);
      },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      }
    );
  }catch(error) {
    this.loading = false;
    event.target.value = null; 
    this.toastr.warning('Warning', 'Failed to load necessary data from API. Please try again later.');
  }
}

async downloadBulkAsset() {
  this.loading=true;
  const termListExists = await this.assetTermsListExist();
  const headers = termListExists
    ? ['id','assetSerialNumber','majorType','minorType','assetCategory', 'assetName', 'assetType', 'ownerDepartment', 'owner','assignedDepartment', 'assetUser','serviceCountryCode', 'serviceContact', 'servicePersonEmail', 'costType','manufacturer', 'assetCost', 'vendorName', 'modelNo', 'productSerialNo', 'serviceProviderName','vendorCountryCode', 'vendorContact', 'vendorEmail', 'poDate','criticality', 'softwareVersion', 'usefulLife', 'depreciationPercent', 'depreciationType', 'description' , 'locationName','bioMedTag','oracleId','oracleDescription','sfdaNo','assetStatus','commissionOn','warrantyPeriod','periodType']
    : ['id','assetSerialNumber','assetCategory', 'assetName', 'assetType', 'ownerDepartment', 'owner','assignedDepartment', 'assetUser','serviceCountryCode', 'serviceContact', 'servicePersonEmail', 'costType','manufacturer', 'assetCost', 'vendorName', 'modelNo', 'productSerialNo', 'serviceProviderName','vendorCountryCode', 'vendorContact', 'vendorEmail', 'poDate','criticality', 'softwareVersion', 'usefulLife', 'depreciationPercent', 'depreciationType', 'description' , 'locationName','bioMedTag','oracleId','oracleDescription','sfdaNo','assetStatus','commissionOn','warrantyPeriod','periodType'];

  const contactFields = ['serviceContact', 'vendorContact'];
  const dateFields = ['commissionOn', 'poDate'];
  const emailFields = ['servicePersonEmail', 'vendorEmail'];
  const numberFields = ['assetCost', 'softwareVersion','warrantyPeriod'];
  const percentageFields = ['depreciationPercent'];
  const nonEditableFields = termListExists ? ['id', 'assetSerialNumber','majorType','minorType','assetCategory','assetType']:['id', 'assetSerialNumber'];

  const workbook = new ExcelJS.Workbook();
  const mainSheet = workbook.addWorksheet('Sheet1');
  const apiSheet = workbook.addWorksheet('Sheet2');

  const headerRow = mainSheet.addRow(headers);
  mainSheet.getColumn(1).hidden = true; // Hide ID column based colIndex
  headers.forEach((header, index) => {
      mainSheet.getColumn(index + 1).width = 30;
      if (nonEditableFields.includes(header)) {
          headerRow.getCell(index + 1).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFCCCB' }, // Light red fill
          };
      }
  });

  let departmentList = [], userNameList = [], assetTypeList = [], costTypeList = [],
  depreciationType = [], criticality = [], locationList = [], assetCategory = [],
  statusList=[], preDownloadedData = [], countryCodeList = [];
  let periodType =['Month','Year']
  let usefulLife = Array.from({ length: 15 }, (_, i) => String(i + 1));

  const apiPromises = [
      this.configurationServices.getAssetDepartment().toPromise().then(res => departmentList = res.results.map(r => r.name) || []),
      this.configurationServices.getTicketUser('', 'RT-US').toPromise().then(res => userNameList = res.results.map(r => r.name) || []),
      this.lookupTermService.getAppTermsWrapper('AssetType').toPromise().then(res => assetTypeList = res.AssetType.map(r => r.value) || []),
      this.lookupTermService.getAppTermsWrapper('CostType').toPromise().then(res => costTypeList = res.CostType.map(r => r.value) || []),
      this.commonService.getAppTermsVerion2('AssetCategory').toPromise().then(res => assetCategory = res.results.map(r => r.value) || []),
      this.lookupTermService.getAppTermsWrapper('DepreciationType').toPromise().then(res => depreciationType = res.DepreciationType.map(r => r.value) || []),
      this.lookupTermService.getAppTermsWrapper('Criticality').toPromise().then(res => criticality = res.Criticality.map(r => r.value) || []),
      this.commonService.getAllLocationList(null, null, '3,17', 'Active', null, null, null).toPromise().then(res => locationList = res.results.map(r => r.fullName) || []),
      this.lookupTermService.getAppTermsWrapper('AssetStatus').toPromise().then(res => statusList = res.AssetStatus.map(r => r.value) || []),
      this.lookupTermService.getAppTermsWrapper('CountryCode').toPromise().then(res => countryCodeList = res.CountryCode.map(r => r.code) || []),
      this.configurationServices.getAllAssets(null,null, null).toPromise().then(res => preDownloadedData = res.results || [])
  ];

  Promise.all(apiPromises)
  .then(() => {
      const dataLists = {
          assetCategory: assetCategory,
          assetType: assetTypeList,
          ownerDepartment: departmentList,
          assignedDepartment: departmentList,
          owner: userNameList,
          assetUser: userNameList,
          costType: costTypeList,
          depreciationType: depreciationType,
          usefulLife: usefulLife,
          criticality: criticality,
          locationName: locationList,
          assetStatus: statusList,
          vendorCountryCode: countryCodeList,
          serviceCountryCode: countryCodeList,
          majorType:assetCategory,
          minorType:assetCategory,
          periodType:periodType
      };

    Object.keys(dataLists).forEach((key, i) => {
      const col = apiSheet.getColumn(i + 1);
      col.values = [key, ...dataLists[key]];
      col.width = 30;
    });

     apiSheet.protect('twDevEx$123', {
          selectLockedCells: true,
          selectUnlockedCells: true,
          formatCells: false,
          formatColumns: false,
          formatRows: false,
          insertColumns: false,
          insertRows: false,
          insertHyperlinks: false,
          deleteColumns: false,
          deleteRows: false,
          sort: false,
          autoFilter: false,
          pivotTables: false
      });

      preDownloadedData.forEach((item, i) => {
      if (!item.id || !item.assetSerialNumber) return;
      const row = mainSheet.getRow(i + 2);
      let serviceCode = null, serviceContact = null;
      if (item.serviceContact) {
        if (item.serviceContact.includes('-')) {
          const [code, number] = item.serviceContact.split('-');
          serviceCode = code || null;
          serviceContact = number || null;
        } else {
          serviceContact = item.serviceContact;
        }
      }
      let vendorCode = null, vendorContact = null;
      if (item.vendorContact) {
        if (item.vendorContact.includes('-')) {
          const [code, number] = item.vendorContact.split('-');
          vendorCode = code || null;
          vendorContact = number || null;
        } else {
          vendorContact = item.vendorContact;
        }
      }

      const values = termListExists ? [
        item.id,
        item.assetSerialNumber,
        item.assetCategoryName,
        item.assetCategory1Name,
        item.assetCategory2Name,
        item.assetName,
        item.assetTypeName,
        item.ownerDepartment,
        item.ownerName,
        item.assignedDepartment,
        item.assetUserName,
        serviceCode,
        serviceContact,
        item.servicePersonEmail,
        item.costTypeName,
        item.manufacturer,
        item.assetCost,
        item.vendorName,
        item.modelId,
        item.productSerialNumber,
        item.serviceProviderName,
        vendorCode,
        vendorContact,
        item.vendorEmail,
        item.poDate ? new Date(item.poDate) : null,
        item.criticalityName,
        item.softwareVersion,
        item.usefulLife,
        item.depreciationPercent,
        item.depreciationTypeName,
        item.comments,
        item.locationDescription,
        item.biomedTagId,
        item.oracleId,
        item.oracleDescription,
        item.sfda,
        item.assetStatusName,
        item.commissionedOn ? new Date(item.commissionedOn) : null,
        this.getWarrantyValue(item.warrantyPeriod ,'period'),
        this.getWarrantyValue(item.warrantyPeriod ,'frequency')
      ] : [
        item.id,
        item.assetSerialNumber,
        item.assetCategoryName,
        item.assetName,
        item.assetTypeName,
        item.ownerDepartment,
        item.ownerName,
        item.assignedDepartment,
        item.assetUserName,
        serviceCode,
        serviceContact,
        item.servicePersonEmail,
        item.costTypeName,
        item.manufacturer,
        item.assetCost,
        item.vendorName,
        item.modelId,
        item.productSerialNumber,
        item.serviceProviderName,
        vendorCode,
        vendorContact,
        item.vendorEmail,
        item.poDate ? new Date(item.poDate) : null,
        item.criticalityName,
        item.softwareVersion,
        item.usefulLife,
        item.depreciationPercent,
        item.depreciationTypeName,
        item.comments,
        item.locationDescription,
        item.biomedTagId,
        item.oracleId,
        item.oracleDescription,
        item.sfda,
        item.assetStatusName,
        item.commissionedOn ? new Date(item.commissionedOn) : null,
        this.getWarrantyValue(item.warrantyPeriod ,'period'),
        this.getWarrantyValue(item.warrantyPeriod ,'frequency')
      ];

      values.forEach((val, colIndex) => {
          const cell = row.getCell(colIndex + 1);
          cell.value = val ?? '';
          const header = headers[colIndex];
          const listColIndex = Object.keys(dataLists).indexOf(header) + 1;
          const colLetter = this.getColumnLetter(listColIndex);
          const listLength = dataLists[header]?.length || 0;
          const rangeAddress = `'${apiSheet.name}'!$${colLetter}$2:$${colLetter}$${listLength + 1}`;
          let validation: any = null;
          if (dataLists[header]) {
            validation = {
              type: 'list',
              allowBlank: true,
              formulae: [rangeAddress],
              showErrorMessage: true,
              errorStyle: 'error',
              errorTitle: 'Invalid Input',
              error: 'Value must be from the list' };
        } else if (dateFields.includes(header)) {
          validation = { 
              type: 'date',
              operator: 'greaterThan',
              formulae: ['DATE(1900,1,1)'],
              allowBlank: true,
              showErrorMessage: true,
              errorStyle: 'stop',
              errorTitle: 'Invalid Date',
              error: 'Enter a valid date (dd-MM-yyyy)' };
        } else if (contactFields.includes(header)) {
          validation = {
              type: 'custom',
              allowBlank: true,
              formulae: [`OR(${cell.address}="", LEN(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(${cell.address},"+",""),"-","")," ",""),"","")) >= 9)`],
              showErrorMessage: true,
              errorStyle: 'stop',
              errorTitle: 'Invalid Contact Number',
              error: 'Enter a valid Contact Number.' };
        } else if (emailFields.includes(header)) {
          validation = {
              type: 'custom',
              allowBlank: true,
              formulae: [
                `OR(${cell.address}="",AND(ISNUMBER(FIND("@",${cell.address})),ISNUMBER(FIND(".",${cell.address})),LEN(${cell.address})-LEN(SUBSTITUTE(${cell.address},"@",""))=1))`
              ],
              showErrorMessage: true,
              errorStyle: 'stop',
              errorTitle: 'Invalid Email',
              error: 'Enter a valid email address'
            };
        } else if (numberFields.includes(header)) {
          validation = { 
              type: 'custom',
              allowBlank: true,
              formulae: [`OR(${cell.address}="",AND(ISNUMBER(${cell.address}),INT(${cell.address})=${cell.address}))`],
              showErrorMessage: true,
              errorStyle: 'stop',
              errorTitle: 'Invalid Number Format',
              error: 'Enter a Valid Number.'
            }
        } else if (percentageFields.includes(header)) {
          validation = { 
              type: 'custom',
              allowBlank: true,
              formulae: [`AND(ISNUMBER(${cell.address}), ${cell.address}>=0, ${cell.address}<=100)`],
              showErrorMessage: true,
              errorStyle: 'stop',
              errorTitle: 'Invalid Percentage',
              error: 'Enter a valid percentage between 0 and 100.',

          };
          }

          if (validation) cell.dataValidation = validation;
          if (!nonEditableFields.includes(header)) cell.protection = { locked: false };
        });
      });

    mainSheet.protect('twDevEx$123', {
          selectLockedCells: true,
          selectUnlockedCells: true,
          formatCells: false,
          formatColumns: false,
          formatRows: false,
          insertColumns: false,
          insertRows: false,
          insertHyperlinks: false,
          deleteColumns: false,
          deleteRows: false,
          sort: false,
          autoFilter: false,
          pivotTables: false
          });

          return workbook.xlsx.writeBuffer();
      }).then(buffer => {
          const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          this.loading=false;
          saveAs(blob, 'download-Modifyasset.xlsx');
  });
}

async uploadBulkAsset(event) {
  this.loading = true;
  const termListExists = await this.assetTermsListExist();
  try {
    const [assetType, department, user, costType, assetCategory, depreciationType, criticality, locationList, assetStatus] = await Promise.all([
      this.lookupTermService.getAppTermsWrapper('AssetType').toPromise(),
      this.configurationServices.getAssetDepartment().toPromise(),
      this.configurationServices.getTicketUser('', 'RT-US').toPromise(),
      this.lookupTermService.getAppTermsWrapper('CostType').toPromise(),
      this.commonService.getAppTermsVerion2('AssetCategory').toPromise(),
      this.lookupTermService.getAppTermsWrapper('DepreciationType').toPromise(),
      this.lookupTermService.getAppTermsWrapper('Criticality').toPromise(),
      this.commonService.getAllLocationList(null, null, '3,17', 'Active', null, null, null).toPromise(),
      this.lookupTermService.getAppTermsWrapper('AssetStatus').toPromise()
    ])
    this.assetTypeList = assetType.AssetType.map(({ code, value }) => ({ code, value }));
    this.departmentList = department.results.map(({ id, name }) => ({ id, name }));
    this.userNameList = user.results.map(({ id, name }) => ({ id, name }));
    this.costTypeList = costType.CostType.map(({ code, value }) => ({ code, value }));
    this.assetCategoryList = assetCategory.results.map(({ code, value }) => ({ code, value }));
    const depreciationTypeList = depreciationType.DepreciationType.map(({ code, value }) => ({ code, value }));
    const criticalityList = criticality.Criticality.map(({ code, value }) => ({ code, value }));
    const locationNameList = locationList.results.map(({ id, fullName }) => ({ id, fullName }));
    const assetStatusList = assetStatus.AssetStatus.map(({ code, value }) => ({ code, value }));
    let periodType =[{code:'M',value:'Month'},{code:'Y',value:'Year'}]

    const file = event.target.files[0];
    if (!file) {
      this.loading = false;
      return;
    }
    let fileReader = new FileReader();
    fileReader.onload = async () => {
      try {
        const arrayBuffer: any = fileReader.result;
        const workbook = XLSX.read(arrayBuffer, { type: "array", cellText: false, cellDates: true });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const headerRow = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] as string [];
        const header = termListExists
        ? ['id','assetSerialNumber','majorType','minorType','assetCategory', 'assetName', 'assetType', 'ownerDepartment', 'owner','assignedDepartment', 'assetUser','serviceCountryCode', 'serviceContact', 'servicePersonEmail', 'costType','manufacturer', 'assetCost', 'vendorName', 'modelNo', 'productSerialNo', 'serviceProviderName','vendorCountryCode', 'vendorContact', 'vendorEmail', 'poDate','criticality', 'softwareVersion', 'usefulLife', 'depreciationPercent', 'depreciationType', 'description' , 'locationName','bioMedTag','oracleId','oracleDescription','sfdaNo','assetStatus','commissionOn','warrantyPeriod','periodType']
        : ['id','assetSerialNumber','assetCategory', 'assetName', 'assetType', 'ownerDepartment', 'owner','assignedDepartment', 'assetUser','serviceCountryCode', 'serviceContact', 'servicePersonEmail', 'costType','manufacturer', 'assetCost', 'vendorName', 'modelNo', 'productSerialNo', 'serviceProviderName','vendorCountryCode', 'vendorContact', 'vendorEmail', 'poDate','criticality', 'softwareVersion', 'usefulLife', 'depreciationPercent', 'depreciationType', 'description' , 'locationName','bioMedTag','oracleId','oracleDescription','sfdaNo','assetStatus','commissionOn','warrantyPeriod','periodType'];
        const normalizedHeaderRow = headerRow.map(h => (h ?? '').toString().trim());
        const normalizedHeader = header.map(h => h.trim());

        if (
          normalizedHeaderRow.length !== normalizedHeader.length ||
          normalizedHeaderRow.some((val, idx) => val !== normalizedHeader[idx])
        ) {
          this.toastr.warning('Warning', 'Invalid column headers. Please check the file.');
          this.loading = false;
          event.target.value = null;
          return;
        }

        const arrayList = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: null, dateNF: 'yyyy-MM-dd;@' ,rawNumbers: false});
        const jsonData = arrayList.map(row => {
        if (!row['id']) return null;
        const type = this.mapAppTermField(row['periodType'], periodType, 'code', 'value');
        const period = Number(row['warrantyPeriod']);
        const isValidWarranty = period > 0 && type &&(row['commissionOn']!= null || row ['commissionOn'] != undefined || row['commissionedOn'] != '');
      const data: any = {
          assetTypeId: this.mapAppTermField(row['assetType'], this.assetTypeList),
          ownerDepartmentId: this.mapAppTermField(row['ownerDepartment'], this.departmentList, 'id', 'name'),
          assignedDepartmentId: this.mapAppTermField(row['assignedDepartment'], this.departmentList, 'id', 'name'),
          ownerId: this.mapAppTermField(row['owner'], this.userNameList, 'id', 'name'),
          assetUserId: this.mapAppTermField(row['assetUser'], this.userNameList, 'id', 'name'),
          costTypeId: this.mapAppTermField(row['costType'], this.costTypeList),
          modelId: row['modelNo'] ? this.formatNumberAsString(row['modelNo']) : null,
          productSerialNumber: row['productSerialNo'] ? this.formatNumberAsString(row['productSerialNo']) : null,
          id: parseInt(row['id'], 10) || null,
          assetName: row['assetName'] || null,
          assetSerialNumber: row['assetSerialNumber'] ? this.formatNumberAsString(row['assetSerialNumber']) : null,
          serviceContact: this.formatContactNumber(row['serviceCountryCode'], row['serviceContact']),
          servicePersonEmail: row['servicePersonEmail'] || null,
          manufacturer: row['manufacturer'] || null,
          commissionedOn: this.parseDate(row['commissionOn']),
          assetCost: row['assetCost'] && !isNaN(parseFloat(row['assetCost'])) ? parseFloat(row['assetCost']).toFixed(2) : null,
          vendorName: row['vendorName'] || null,
          serviceProviderName: row['serviceProviderName'] || null,
          vendorContact: this.formatContactNumber(row['vendorCountryCode'], row['vendorContact']),
          vendorEmail: row['vendorEmail'] || null,
          poDate: this.parseDate(row['poDate']),
          criticalityId: this.mapAppTermField(row['criticality'], criticalityList),
          softwareVersion: row['softwareVersion'] || null,
          usefulLife: row['usefulLife'] || null,
          depreciationPercent: row['depreciationPercent'] || null,
          depreciationTypeId: this.mapAppTermField(row['depreciationType'], depreciationTypeList),
          comments: row['description'] || null,
          locationId: this.mapAppTermField(row['locationName'], locationNameList, 'id', 'fullName'),
          assetStatus: this.mapAppTermField(row['assetStatus'], assetStatusList),
          biomedTagId : row['bioMedTag']? this.formatNumberAsString(row['bioMedTag']):null,
          oracleId: row['oracleId']? this.formatNumberAsString(row['oracleId']): null,
          oracleDescription: row['oracleDescription']?row['oracleDescription']: null,
          sfda: row['sfdaNo']? this.formatNumberAsString(row['sfdaNo']): null,
          warrantyPeriod: isValidWarranty ? this.formatWarrantyPeriod(period, type): null,
          warrantyDue: isValidWarranty? this.calculateEndDate(row['commissionOn'], period, type): null
        }
          if (termListExists) {
            data.assetCategoryId  = this.mapAppTermField(row['majorType'], this.assetCategoryList);
            data.assetCategory1Id = this.mapAppTermField(row['minorType'], this.assetCategoryList);
            data.assetCategory2Id = this.mapAppTermField(row['assetCategory'], this.assetCategoryList);
          } else {
            data.assetCategoryId = this.mapAppTermField(row['assetCategory'], this.assetCategoryList);
          }

          return data;
        }).filter(x => x);
        this.loading = false;
        event.target.value = null;
        if (!jsonData.length) {
          this.toastr.warning('Warning', 'No valid asset records found.');
          return;
        }

        this.loading = true;
        this.hospitalService.importBulkAsset(jsonData).subscribe(res => {
          this.loading = false;
          if (res.results.assets && res.results.assets.length > 0) {
            this.toastr.warning('Warning', `${res.results.note}`);
            this.generateExcel(res.results.assets);
          } else {
            this.toastr.success('Success', `${res.message}`);
          }
        },
          err => {
          this.loading = false;
          this.toastr.error('Error', err.error?.message || 'Failed to import assets.');
        });
      }catch(err) {
        this.loading = false; 
        event.target.value = null;
        this.toastr.error('Error', 'Error parsing the uploaded file.');
      }
    };
    fileReader.readAsArrayBuffer(file);
  }catch(error) {
    this.loading = false;
    event.target.value = null;
    this.toastr.warning('Warning', 'Failed to load necessary data from API. Please try again later.');
  }
}

async generateExcel(preDownloadedData) {
  const termListExists = await this.assetTermsListExist();

  const headers = termListExists
    ? ['id','assetSerialNumber','majorType','minorType','assetCategory', 'assetName', 'assetType', 'ownerDepartment', 'owner','assignedDepartment', 'assetUser','serviceCountryCode', 'serviceContact', 'servicePersonEmail', 'costType','manufacturer', 'assetCost', 'vendorName', 'modelNo', 'productSerialNo', 'serviceProviderName','vendorCountryCode', 'vendorContact', 'vendorEmail', 'poDate','criticality', 'softwareVersion', 'usefulLife', 'depreciationPercent', 'depreciationType', 'description' , 'locationName','bioMedTag','oracleId','oracleDescription','sfdaNo','assetStatus','commissionOn','warrantyPeriod','periodType']
    : ['id','assetSerialNumber','assetCategory', 'assetName', 'assetType', 'ownerDepartment', 'owner','assignedDepartment', 'assetUser','serviceCountryCode', 'serviceContact', 'servicePersonEmail', 'costType','manufacturer', 'assetCost', 'vendorName', 'modelNo', 'productSerialNo', 'serviceProviderName','vendorCountryCode', 'vendorContact', 'vendorEmail', 'poDate','criticality', 'softwareVersion', 'usefulLife', 'depreciationPercent', 'depreciationType', 'description' , 'locationName','bioMedTag','oracleId','oracleDescription','sfdaNo','assetStatus','commissionOn','warrantyPeriod','periodType'];

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet([], { header: headers });

  worksheet['!cols'] = Array.from({ length: headers.length }, () => ({ wch: 20 }));
  worksheet.getColumn(1).hidden = true; // Hide ID column based colIndex
  const data = preDownloadedData.map(item => {
      let serviceCode = null, serviceContact = null;
      if (item.serviceContact) {
        if (item.serviceContact.includes('-')) {
          const [code, number] = item.serviceContact.split('-');
          serviceCode = code?.trim() || null;
          serviceContact = number?.trim() || null;
        } else {
          serviceContact = item.serviceContact?.trim() || null;
        }
      }
      let vendorCode = null, vendorContact = null;
      if (item.vendorContact) {
        if (item.vendorContact.includes('-')) {
          const [code, number] = item.vendorContact.split('-');
          vendorCode = code?.trim() || null;
          vendorContact = number?.trim() || null;
        } else {
          vendorContact = item.vendorContact?.trim() || null;
        }
      }

      return termListExists ? {
        id: item.id,
        assetSerialNumber: item.assetSerialNumber,
        majorType: item.assetCategoryName,
        minorType: item.assetCategory1Name,
        assetCategory: item.assetCategory2Name,
        assetName: item.assetName,
        assetType: item.assetTypeName,
        ownerDepartment: item.ownerDepartment,
        owner: item.ownerName,
        assignedDepartment: item.assignedDepartment,
        assetUser: item.assetUserName,
        serviceCountryCode: serviceCode,
        serviceContact: serviceContact,
        servicePersonEmail: item.servicePersonEmail,
        costType: item.costTypeName,
        manufacturer: item.manufacturer,
        assetCost: item.assetCost,
        vendorName: item.vendorName,
        modelNo: item.modelId,
        productSerialNo: item.productSerialNumber,
        serviceProviderName: item.serviceProviderName,
        vendorCountryCode: vendorCode,
        vendorContact: vendorContact,
        vendorEmail: item.vendorEmail,
        poDate:  item.poDate ? new Date(item.poDate) : null,
        criticality: item.criticalityName,
        softwareVersion: item.softwareVersion,
        usefulLife: item.usefulLife,
        depreciationPercent: item.depreciationPercent,
        depreciationType: item.depreciationTypeName,
        description: item.comments,
        locationName: item.locationDescription,
        bioMedTag: item.biomedTagId,
        oracleId: item.oracleId,
        oracleDescription: item.oracleDescription,
        sfdaNo: item.sfda,
        assetStatus: item.assetStatusName,
        commissionOn:  item.commissionedOn ? new Date(item.commissionedOn): null,
        warrantyPeriod :this.getWarrantyValue(item.warrantyPeriod ,'period'),
        periodType : this.getWarrantyValue(item.warrantyPeriod ,'frequency'),
        error:item.error
      } : {
        id: item.id,
        assetSerialNumber: item.assetSerialNumber,
        assetCategory: item.assetCategoryName,
        assetName: item.assetName,
        assetType: item.assetTypeName,
        ownerDepartment: item.ownerDepartment,
        owner: item.ownerName,
        assignedDepartment: item.assignedDepartment,
        assetUser: item.assetUserName,
        serviceCountryCode: serviceCode,
        serviceContact: serviceContact,
        servicePersonEmail: item.servicePersonEmail,
        costType: item.costTypeName,
        manufacturer: item.manufacturer,
        assetCost: item.assetCost,
        vendorName: item.vendorName,
        modelNo: item.modelId,
        productSerialNo: item.productSerialNumber,
        serviceProviderName: item.serviceProviderName,
        vendorCountryCode: vendorCode,
        vendorContact: vendorContact,
        vendorEmail: item.vendorEmail,
        poDate:  item.poDate ? new Date(item.poDate) : null,
        criticality: item.criticalityName,
        softwareVersion: item.softwareVersion,
        usefulLife: item.usefulLife,
        depreciationPercent: item.depreciationPercent,
        depreciationType: item.depreciationTypeName,
        description: item.comments,
        locationName: item.locationDescription,
        bioMedTag: item.biomedTagId,
        oracleId: item.oracleId,
        oracleDescription: item.oracleDescription,
        sfdaNo: item.sfda,
        assetStatus: item.assetStatusName,
        commissionOn:  item.commissionedOn ? new Date(item.commissionedOn): null,
        warrantyPeriod :this.getWarrantyValue(item.warrantyPeriod ,'period'),
        periodType : this.getWarrantyValue(item.warrantyPeriod ,'frequency'),
        error:item.error
      };
  });

  XLSX.utils.sheet_add_json(worksheet, data, { skipHeader: true, origin: 'A2' });

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Assets');

  XLSX.writeFile(workbook, 'errorLog.xlsx');
}

  downloadHealthTest() {
    this.loading = true;
    const headers = ['name','healthTestGroupId','sourceId', 'sourceType', 'shortNotes','longNotes', 'allowPartial', 'minDuration', 'maxDuration','minInterval','sequence', 'priority', 'autoComplete', 'isDiabetic', 'isExternal','isAdmin', 'shortName', 'isForLater', 'isTestInBatch','maxWaitDuration','testCategoryId','testGroup', 'isActive'];
    const mandatoryFields = ['name','sourceId', 'isActive'];
    const workbook = new ExcelJS.Workbook();
    const mainSheet = workbook.addWorksheet('Sheet1');
    const apiSheet = workbook.addWorksheet('Sheet2');
    const headerRow = mainSheet.addRow(headers);
    headers.forEach((header, index) => {
      mainSheet.getColumn(index + 1).width = 30;
    });
    headers.forEach((header, index) => {
      if (mandatoryFields.includes(header)) {
        const cell = headerRow.getCell(index + 1);
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFCCCB' }, // Light red fill
        };
      }
    });

    let testCategoryList = [];
    let healthTestGroupList = [];
    const apiPromises = [
      this.lookupTermService.getAppTermsWrapper('TestCategory').toPromise().then(res => testCategoryList = res.TestCategory.map(({ value}) => value) || []),
      this.hospitalService.getHealthGroup().toPromise().then(res => healthTestGroupList = res.results.map(({ name }) => name) || []),
    ];
    Promise.all(apiPromises)
      .then(() => this.configurationServices.getConfigFile('excel-config').toPromise())
      .then(res => {
        this.totalRecords = res?.results?.contentObject?.healthTest ? res.results.contentObject.healthTest + 1 : 1001;
  
        const dataLists = {
            testCategoryId: testCategoryList,
            healthTestGroupId: healthTestGroupList,
            allowPartial:['Y','N'],
            autoComplete:['Y','N'],
            isDiabetic:['Y','N'],
            isExternal:['Y','N'],
            isAdmin:['Y','N'],
            isForLater:['Y','N'],
            isTestInBatch:['Y','N'],
            isActive:['Y','N'],
        };

        Object.entries(dataLists).forEach(([key, list], index) => {
            const col = index + 1;
            apiSheet.getColumn(col).values = [key, ...list];
            apiSheet.getColumn(col).width = 30;
        });
        apiSheet.protect('twDevEx$123', {
          selectLockedCells: true,
          selectUnlockedCells: true,
          formatCells: false,
          formatColumns: false,
          formatRows: false,
          insertColumns: false,
          insertRows: false,
          insertHyperlinks: false,
          deleteColumns: false,
          deleteRows: false,
          sort: false,
          autoFilter: false,
          pivotTables: false
        });

        headers.forEach((header, colIndex) => {
          if (dataLists[header]) {
            const colLetter = String.fromCharCode(65 + Object.keys(dataLists).indexOf(header)); // Column letter for data validation
            const rangeAddress = `${apiSheet.name}!$${colLetter}$2:$${colLetter}$${dataLists[header].length + 1}`; // Formula for data validation using cell range
    
            for (let rowIndex = 2; rowIndex <= this.totalRecords; rowIndex++) {
              const cell = mainSheet.getCell(rowIndex, colIndex + 1);
              const validation = {
                type: 'list',
                allowBlank: true,
                formulae: [rangeAddress],
                showErrorMessage: true,
                errorStyle: 'error',
                errorTitle: 'Invalid Input',
                error: 'Value must be from the list',
              };
              cell.dataValidation = validation;
            }
          }
        });
        return workbook.xlsx.writeBuffer();
    })
    .then(buffer => {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          this.loading = false;
        saveAs(blob, 'download-healthTest.xlsx');
    })
}

async healthTestImport(event) {
  this.loading=true;
  try {
  const [testCategories, healthTestGroups] = await Promise.all([
    this.lookupTermService.getAppTermsWrapper('TestCategory').toPromise(),
    this.hospitalService.getHealthGroup().toPromise(),
  ])
    this.testCategoryList = testCategories.TestCategory.map(({ code, value }) => ({ code, value }));
    this.healthTestGroupList = healthTestGroups.results.map(({ id, name }) => ({ id, name }));

  const file = event.target.files[0];
  let fileReader = new FileReader();

  fileReader.onload = () => {
      const arrayBuffer = fileReader.result  as ArrayBuffer;
    let workbook = XLSX.read(arrayBuffer, { type: "array", cellText: false, cellDates: true });
    let worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const headerRow = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] as string [];
    const expectedHeader = ['name','healthTestGroupId','sourceId', 'sourceType', 'shortNotes', 'longNotes', 'allowPartial', 'minDuration', 'maxDuration', 'minInterval', 'sequence', 'priority', 'autoComplete', 'isDiabetic', 'isExternal', 'isAdmin', 'shortName', 'isForLater', 'isTestInBatch', 'maxWaitDuration', 'testCategoryId', 'testGroup', 'isActive'];

    if (headerRow.join(",") !== expectedHeader.join(",")) {
      this.toastr.warning('Warning', 'Invalid column headers. Please check the file.');
      this.loading = false;
      event.target.value = null;
      return;
      }

      const safeTrim = (value) => value ? value.trim() : null;
      const booleanFields = ['allowPartial', 'autoComplete','isDiabetic','isExternal', 'isAdmin', 'isForLater', 'isTestInBatch', 'isActive'];
      const integerFields = ['priority','sequence','healthTestGroupId','minDuration', 'maxDuration', 'minInterval', 'maxWaitDuration'];

      const arrayList = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: null, dateNF: 'yyyy-MM-dd;@' });
      const jsonData = arrayList.map(data => {
          booleanFields.forEach(field => data[field] = safeTrim(data[field])?.toLowerCase() === 'y');
          integerFields.forEach(field => data[field] = parseInt(data[field], 10));

        return {
          name: safeTrim(data['name']),
          testGroup: safeTrim(data['testGroup']),
          sourceId: safeTrim(data['sourceId']),
          sourceType: safeTrim(data['sourceType']),
          shortNotes: safeTrim(data['shortNotes']),
          longNotes: safeTrim(data['longNotes']),
          allowPartial: data['allowPartial'],
          minDuration: data['minDuration'],
          maxDuration: data['maxDuration'],
          minInterval: data['minInterval'],
          sequence: data['sequence'],
          priority: data['priority'],
          autoComplete: data['autoComplete'],
          isDiabetic: data['isDiabetic'],
          isExternal: data['isExternal'],
          isAdmin: data['isAdmin'],
          shortName: safeTrim(data['shortName']),
          isForLater: data['isForLater'],
          isTestInBatch: data['isTestInBatch'],
          maxWaitDuration: data['maxWaitDuration'],
          testCategoryId: this.mapAppTermField(data['testCategoryId'], this.testCategoryList, 'code', 'value'),
          healthTestGroupId: this.mapAppTermField(data['healthTestGroupId'], this.healthTestGroupList, 'id', 'name'),
          isActive: data['isActive'],
        };
      });
      this.loading = false;
      event.target.value = null;

      if (jsonData.length === 0) {
        this.toastr.warning('Warning', 'Invalid data for Import. Please check the file.');
        return;
      }

      this.hospitalService.importBulkHealthTest(jsonData).subscribe({
        next: (res) => this.toastr.success('Success', `${res.results.note}`),
        error: (error) => this.toastr.error('Error', `${error.error.message}`)
      });
    };

    fileReader.readAsArrayBuffer(file);
  }catch {
      this.loading = false; 
      event.target.value = null;
    this.toastr.warning('Warning', 'Failed to load necessary data from API. Please try again later.');
  }
}

downloadHealthPackage() {
  this.loading=true;
  const headers = ['name', 'description', 'isActive', 'sourceId', 'sourceType', 'gender', 'healthTestId', 'healthTestName','healthTestGroupId'];
  const mandatoryFields = ['name', 'healthTestId', 'sourceId', 'isActive'];
  const workbook = new ExcelJS.Workbook();
  const mainSheet = workbook.addWorksheet('Sheet1');
  const apiSheet = workbook.addWorksheet('Sheet2');
  const headerRow = mainSheet.addRow(headers);
  headers.forEach((header, index) => {
    mainSheet.getColumn(index + 1).width = 30;
  });
  headers.forEach((header, index) => {
    if (mandatoryFields.includes(header)) {
      const cell = headerRow.getCell(index + 1);
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFCCCB' }, // Light red fill
      };
    }
  });

  let healthTestGroupList = [];
  const apiPromises = [
    this.hospitalService.getHealthGroup().toPromise().then(res => healthTestGroupList = res.results.map(({ name }) => name) || []),
    this.configurationServices.getConfigFile('excel-config').toPromise()
  ];

  Promise.all(apiPromises).then(([res]) => {
    this.totalRecords = res?.results?.contentObject?.healthPackage ? res.results.contentObject.healthPackage + 1 : 1001;

    const dataLists = {
      healthTestGroupId: healthTestGroupList,
      gender:['Male','Female'],
      isActive: ['Y', 'N'],
    };

    Object.entries(dataLists).forEach(([key, list], index) => {
      const col = index + 1;
      apiSheet.getColumn(col).values = [key, ...list];
      apiSheet.getColumn(col).width = 30;
    });

    apiSheet.protect('twDevEx$123', {
      selectLockedCells: true,
      selectUnlockedCells: true,
      formatCells: false,
      formatColumns: false,
      formatRows: false,
      insertColumns: false,
      insertRows: false,
      insertHyperlinks: false,
      deleteColumns: false,
      deleteRows: false,
      sort: false,
      autoFilter: false,
      pivotTables: false
    });

      headers.forEach((header, colIndex) => {
        if (dataLists[header]) {
          const colLetter = String.fromCharCode(65 + Object.keys(dataLists).indexOf(header)); // Column letter for data validation
        const rangeAddress = `${apiSheet.name}!$${colLetter}$2:$${colLetter}$${dataLists[header].length + 1}`; // Formula for data validation using cell range

        for (let rowIndex = 2; rowIndex <= this.totalRecords; rowIndex++) {
          const cell = mainSheet.getCell(rowIndex, colIndex + 1);
          const validation = {
            type: 'list',
            allowBlank: true,
            formulae: [rangeAddress],
            showErrorMessage: true,
            errorStyle: 'error',
            errorTitle: 'Invalid Input',
            error: 'Value must be from the list',
          };
          cell.dataValidation = validation;
        }
    }
    });
    return workbook.xlsx.writeBuffer();
  })
  .then(buffer => {
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    this.loading=false;
    saveAs(blob, 'download-healthPackage.xlsx');
  });
}

async healthPackageImport(event) {
  this.loading=true;
  type HealthData = {
    name: string;
    description: string;
    sourceId: string;
    sourceType: string;
    isActive: any;
    gender: string;
    healthTestId?: number;
    healthTestName?: string;
    healthTestGroupId?: string;
  };

  try{
      const healthTestGroups = await this.hospitalService.getHealthGroup().toPromise();
      this.healthTestGroupList = healthTestGroups.results.map(({ id, name }) => ({ id, name }));

  const file = event.target.files[0];
  const fileReader = new FileReader();

    fileReader.onload = () => {
    const arrayBuffer = fileReader.result as ArrayBuffer;
    const workbook = XLSX.read(arrayBuffer, { type: "array", cellText: false, cellDates: true });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const headerRow = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] as string [];
    const header = ['name', 'description', 'isActive', 'sourceId', 'sourceType', 'gender', 'healthTestId', 'healthTestName','healthTestGroupId'];
        if (headerRow.join(",") !== header.join(",")) {
        this.toastr.warning('Invalid column headers. Please check the file.', 'Warning');
        this.loading=false;
        event.target.value = null;
        return;
    }

      const arrayList = XLSX.utils.sheet_to_json<HealthData>(worksheet, { raw: false, defval: null, dateNF: 'yyyy-MM-dd;@'});

      const jsonDataMap = {};
      const safeTrim = (value: string) => (value ? value.trim() : null);

     for (const data of arrayList) {
      const healthTestGroupName = safeTrim(data.healthTestGroupId ?? null);
      const matchingGroup = this.healthTestGroupList.find(group => group.name.trim().toLowerCase() === healthTestGroupName?.toLowerCase());
      data.healthTestGroupId = matchingGroup ? matchingGroup.id : null;
      data.isActive = safeTrim(data['isActive']).toLowerCase() === 'y';
      data.gender = data.gender ? safeTrim(data.gender) : null;
      const key = `${data.name}_${data.sourceId}`;
      if (!jsonDataMap[key]) {
        jsonDataMap[key] = {
          name: safeTrim(data.name),
          description: safeTrim(data.description),
          sourceId: safeTrim(data.sourceId),
          sourceType: safeTrim(data.sourceType),
          isActive: data.isActive,
          gender: data.gender,
          tests: []
        };
      }

      if (data.healthTestId && data.healthTestName) {
        jsonDataMap[key].tests.push({
          healthTestId: data.healthTestId,
          healthTestName: data.healthTestName,
          healthTestGroupId:data.healthTestGroupId
        });
      }
    }

    const jsonData = Object.values(jsonDataMap);
    this.loading = false; 
    event.target.value = null;

    if (jsonData.length === 0) {
      this.toastr.warning('Invalid data for import. Please check the file.', 'Warning');
      return;
    }
    this.hospitalService.importBulkHealthPlan(jsonData).subscribe({
      next: res => this.toastr.success('Success', `${res.results.note}`),
      error: err => this.toastr.error('Error', `${err.error.message}`)
    });
  };
  
      fileReader.readAsArrayBuffer(file);
    }catch{
      this.loading = false;
      event.target.value = null;
      this.toastr.warning('Failed to load necessary data. Please try again later.', 'Warning');
  }
}



downloadReader() {
  this.loading=true;
  const headers = ['ReaderId', 'HardwareType', 'ReaderType', 'MacId', 'ModelNo', 'ReaderVersion', 'ReaderConnectivityType', 'EnableReader'];
  const mandatoryFields =['ReaderId', 'HardwareType', 'ReaderType', 'MacId', 'ModelNo', 'ReaderVersion', 'ReaderConnectivityType', 'EnableReader'];
  const workbook = new ExcelJS.Workbook();
  const mainSheet = workbook.addWorksheet('Sheet1');
  const apiSheet = workbook.addWorksheet('Sheet2');

  const headerRow = mainSheet.addRow(headers);
  headers.forEach((header, index) => {
      mainSheet.getColumn(index + 1).width = 30;
  });
  headers.forEach((header, index) => {
    if (mandatoryFields.includes(header)) {
        const cell = headerRow.getCell(index + 1);
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFCCCB' }, // Light red fill
        };
    }
});

  let hardwareTypeList = [];
  let readerTypeList = [];
  let readerConnectivityTypeList = [];
  let readerVersion =[];

  const apiPromises = [
      this.lookupTermService.getAppTermsWrapper('ReaderHardwareType').toPromise().then(res => hardwareTypeList = res.ReaderHardwareType.map(({ value }) => value) || []),
      this.lookupTermService.getAppTermsWrapper('ReaderType').toPromise().then(res => readerTypeList = res.ReaderType.map(({ value }) => value) || []),
      this.lookupTermService.getAppTermsWrapper('ReaderConnectivityType').toPromise().then(res => readerConnectivityTypeList = res.ReaderConnectivityType.map(({ value }) => value) || []),
      this.configurationServices.getReaderVersions().toPromise().then(res =>readerVersion= res.results.map(item => `${item.swVersion}(${item.hardwareTypeId})`) || []),
  ];

  Promise.all(apiPromises)
  .then(() => {
    return this.configurationServices.getConfigFile('excel-config').toPromise();
})
.then(res => {
  this.totalRecords = res?.results?.contentObject?.reader ? res.results.contentObject.reader + 1 : 1001;
      const dataLists = {
          HardwareType: hardwareTypeList,
          ReaderType: readerTypeList,
          ReaderConnectivityType: readerConnectivityTypeList,
          EnableReader: ['Enabled','Disabled'],
          ReaderVersion:readerVersion
      };

      Object.entries(dataLists).forEach(([key, list], index) => {
          const col = index + 1;
          apiSheet.getColumn(col).values = [key, ...list];
          apiSheet.getColumn(col).width = 30;
      });

      apiSheet.protect('twDevEx$123', {
          selectLockedCells: true,
          selectUnlockedCells: true,
          formatCells: false,
          formatColumns: false,
          formatRows: false,
          insertColumns: false,
          insertRows: false,
          insertHyperlinks: false,
          deleteColumns: false,
          deleteRows: false,
          sort: false,
          autoFilter: false,
          pivotTables: false
      });

      headers.forEach((header, colIndex) => {
          if (dataLists[header]) {
              const colLetter = String.fromCharCode(65 + Object.keys(dataLists).indexOf(header)); // Column letter for data validation
              const rangeAddress = `${apiSheet.name}!$${colLetter}$2:$${colLetter}$${dataLists[header].length + 1}`; // Formula for data validation using cell range

              for (let rowIndex = 2; rowIndex <= 501; rowIndex++) { // Apply validation to 500 rows
                  const cell = mainSheet.getCell(rowIndex, colIndex + 1);
                  const validation = {
                      type: 'list',
                      allowBlank: true,
                      formulae: [rangeAddress],
                      showErrorMessage: true,
                      errorStyle: 'error',
                      errorTitle: 'Invalid Input',
                      error: 'Value must be from the list',
                  };
                  cell.dataValidation = validation;
              }
          }
      });

      return workbook.xlsx.writeBuffer();
  })
  .then(buffer => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      this.loading=false;
      saveAs(blob, 'download-Reader.xlsx');
  });
}

async readerImport(event) {
  this.loading = true;
  try {
    const [hardwareTypeRes, readerTypeRes, readerConnectivityTypeRes, readerVersionRes] = await
      Promise.all([
        this.lookupTermService.getAppTermsWrapper('ReaderHardwareType').toPromise(),
        this.lookupTermService.getAppTermsWrapper('ReaderType').toPromise(),
        this.lookupTermService.getAppTermsWrapper('ReaderConnectivityType').toPromise(),
        this.configurationServices.getReaderVersions().toPromise()
      ])
    this.readerHardwareTypeList = hardwareTypeRes.ReaderHardwareType.map(({ code, value }) => ({ code, value }));
    this.readerTypeList = readerTypeRes.ReaderType.map(({ code, value }) => ({ code, value }));
    this.readerConnectivityTypeList = readerConnectivityTypeRes.ReaderConnectivityType.map(({ code, value }) => ({ code, value }));
    this.readerVersion = readerVersionRes.results.map(item => ({
      id: item.id,
      versionType: `${item.swVersion} (${item.hardwareTypeId})`
    }));

    const file = event.target.files[0];
    if (!file) {
      this.loading = false;
      return;
    }

    const arrayBuffer: ArrayBuffer = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });

    const workbook = XLSX.read(arrayBuffer, { type: "array", cellText: false, cellDates: true });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const headerRow = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] as string [];
    const header = ['ReaderId', 'HardwareType', 'ReaderType', 'MacId', 'ModelNo', 'ReaderVersion', 'ReaderConnectivityType', 'EnableReader'];

    if (headerRow.join(",") !== header.join(",")) {
      this.toastr.warning('Warning', 'Invalid column headers. Please check the file.');
      this.loading = false;
      event.target.value = null;
      return;
    }

    const arrayList = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: null, dateNF: 'yyyy-MM-dd;@' });
    const safeTrim = (value) => value ? value.toString().trim() : null;
    const normalize = (str: string) =>
      safeTrim(str).replace(/\s+/g, '').replace(/[()]/g, '').toLowerCase();

    const jsonData = arrayList.map(data => {
      const inputVersion = safeTrim(data['ReaderVersion']);
      const matchedVersion = this.readerVersion.find(item =>
        normalize(item.versionType) === normalize(inputVersion)
      );
      return {
        enableReader: safeTrim(data['EnableReader']) === 'Enabled',
        hardwareType: this.mapAppTermField(data['HardwareType'], this.readerHardwareTypeList) || null,
        macId: safeTrim(data['MacId']) || null,
        model: safeTrim(data['ModelNo']) || null,
        readerConnectivityType: this.mapAppTermField(data['ReaderConnectivityType'], this.readerConnectivityTypeList) || null,
        readerId: safeTrim(data['ReaderId']) || null,
        readerType: this.mapAppTermField(data['ReaderType'], this.readerTypeList) || null,
        readerVersion: matchedVersion ? matchedVersion.id : null
      };
    });

    this.loading = false;
    event.target.value = null;
    if (!jsonData.length) {
      this.toastr.warning('Warning', 'Invalid data for Import. Please check the file.');
      this.loading = false;
      event.target.value = null;
      return;
    }

    this.hospitalService.importBulkReader(jsonData).subscribe(
      res => {
        this.toastr.success('Success', `${res.results.note}`)
      },
      err =>
        this.toastr.error('Error', `${err.error.message}`)
    );
  } catch (err) {
    this.loading = false;
    event.target.value = null;
    this.toastr.error('Error', err?.error?.message || 'Failed to process reader import.');
  }
}

downloadUser() {
  this.loading=true;
  const headers = ['Role', 'First Name', 'Last Name', 'Email', 'Country Code', 'Phone Number', 'Birth Date','Gender','Employee ID'];
  const mandatoryFields =['Role', 'First Name', 'Last Name', 'Email', 'Country Code', 'Phone Number',];
  const workbook = new ExcelJS.Workbook();
  const mainSheet = workbook.addWorksheet('Sheet1');
  const apiSheet = workbook.addWorksheet('Sheet2');

  const headerRow = mainSheet.addRow(headers);
  headers.forEach((header, index) => {
      mainSheet.getColumn(index + 1).width = 30;
  });
  headers.forEach((header, index) => {
    if (mandatoryFields.includes(header)) {
        const cell = headerRow.getCell(index + 1);
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFCCCB' }, // Light red fill
        };
    }
});

  let roleList = [];

  const apiPromises = [
    this.commonService.getAllRole().toPromise().then(res => roleList = res.results.map(({ name }) => name) || []),
  ];

  Promise.all(apiPromises)
  .then(() => {
    return this.configurationServices.getConfigFile('excel-config').toPromise();
})
.then(res => {
  this.totalRecords = res?.results?.contentObject?.user ? res.results.contentObject.user + 1 : 1001;
      const dataLists = {
        Role:roleList,
        Gender:['Male','Female'],
      };

      Object.entries(dataLists).forEach(([key, list], index) => {
          const col = index + 1;
          apiSheet.getColumn(col).values = [key, ...list];
          apiSheet.getColumn(col).width = 30;
      });

      apiSheet.protect('twDevEx$123', {
          selectLockedCells: true,
          selectUnlockedCells: true,
          formatCells: false,
          formatColumns: false,
          formatRows: false,
          insertColumns: false,
          insertRows: false,
          insertHyperlinks: false,
          deleteColumns: false,
          deleteRows: false,
          sort: false,
          autoFilter: false,
          pivotTables: false
      });

      headers.forEach((header, colIndex) => {
          if (dataLists[header]) {
              const colLetter = String.fromCharCode(65 + Object.keys(dataLists).indexOf(header)); // Column letter for data validation
              const rangeAddress = `${apiSheet.name}!$${colLetter}$2:$${colLetter}$${dataLists[header].length + 1}`; // Formula for data validation using cell range

              for (let rowIndex = 2; rowIndex <= this.totalRecords; rowIndex++) { // Apply validation to 500 rows
                  const cell = mainSheet.getCell(rowIndex, colIndex + 1);
                  const validation = {
                      type: 'list',
                      allowBlank: true,
                      formulae: [rangeAddress],
                      showErrorMessage: true,
                      errorStyle: 'error',
                      errorTitle: 'Invalid Input',
                      error: 'Value must be from the list',
                  };
                  cell.dataValidation = validation;
              }
          }
      });

      return workbook.xlsx.writeBuffer();
  })
  .then(buffer => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      this.loading=false;
      saveAs(blob, 'download-User.xlsx');
  });
}

async userImport(event){
    this.loading = true;
    try {
    const [RoleRes] = await Promise.all([
      this.commonService.getAllRole().toPromise()
    ])
      this.roleList = RoleRes.results.map(({ id, name }) => ({ id, name }));
      const file = event.target.files[0];
      if (!file) {
        this.loading = false;
        return;
      }
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array", cellText: false, cellDates: true });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const headerRow = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] as string[];
      const header = ['Role', 'First Name', 'Last Name', 'Email', 'Country Code', 'Phone Number', 'Birth Date','Gender','Employee ID'];
        if (headerRow.join(",") !== header.join(",")) {
          this.toastr.warning('Warning', 'Invalid column headers. Please check the file.');
          this.loading = false;
          event.target.value = null;
          return;
      }
  
      const arrayList = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: null, dateNF: 'yyyy-MM-dd;@' });
      const jsonData = arrayList.map(data => {
      const safeTrim = (value) => value ? value.trim() : null;
      const roleName = safeTrim(data['Role']);
      const role = this.roleList.find(r => r.name.trim().toLowerCase() === roleName.toLowerCase());
      const roleId = role ? role.id : null;
      const countryCode = safeTrim(data['Country Code']);
      const phone = safeTrim(data['Phone Number']);
        let facilityId = localStorage.getItem(btoa('facilityId'));
        let phoneNumber = null;
        if (countryCode && phone) {
          const normalizedCode = countryCode.startsWith('+') ? countryCode : `+${countryCode}`;
          phoneNumber = `${normalizedCode}${phone}`;
        }
        return {
          customerId: facilityId,
          roleIds: [roleId],
          firstName: safeTrim(data['First Name']),
          lastName: safeTrim(data['Last Name']),
          email: safeTrim(data['Email']),
          phoneNumber : phoneNumber,
          birthDate: safeTrim(data['Birth Date']),
          gender: safeTrim(data['Gender']),
          employeeId: safeTrim(data['Employee ID']),
          userName: safeTrim(data['Email']),
        };
      });
  
      this.loading = false;
      event.target.value = null; 
      if (!jsonData.length) {
        this.toastr.warning('Warning', 'Invalid data for Import. Please check the file.');
        this.loading = false; 
        event.target.value = null;
        return;
      }
      this.hospitalService.importBulkUser(jsonData).subscribe(res => {
          if (res.statusCode === 0) {
            this.toastr.error('Error', `${res.results.errors}`);
          } else {
            this.toastr.success('Success', `${res.results.message}`);
          }
        },
        error => {
          this.toastr.error('Error', `${error.error.message}`);
        }
      );
    }catch(err) {
      this.loading = false;
      event.target.value = null;
      this.toastr.warning('Warning', 'Failed to load necessary data from API. Please try again later.');
    }
  }

  async downloadItems(type) {
  this.loading = true;
  const itemCode = type === 'consumables' ? 'IT-CON' : type === ' implants'?'IT-IMP' : null;
  const fileName = type === 'consumables' ? 'download-Consumables.xlsx' : type === ' implants'? 'download-Implants.xlsx' : 'download-ItemMaster.xlsx';
  const headers = [
    'Item No', 'Item Type', 'Item Category', 'Description', 'Name',
    'Reorder Level', 'Minimum Stock Level', 'Unit of Measure',
    'Average Cost', 'Comments'
  ];
  const mandatoryFields = ['Item No', 'Item Type', 'Item Category', 'Name'];

  try {
    const workbook = new ExcelJS.Workbook();
    const mainSheet = workbook.addWorksheet('Sheet1');
    const apiSheet = workbook.addWorksheet('Sheet2');
    const headerRow = mainSheet.addRow(headers);

    // Style header row + mandatory highlight
    headers.forEach((header, index) => {
      mainSheet.getColumn(index + 1).width = 30;
      if (mandatoryFields.includes(header)) {
        headerRow.getCell(index + 1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFCCCB' } // Light red for mandatory
        };
      }
    });

    const totalRecords = 1001;

    // Fetch terms in parallel
    const [itemTypeRes, itemCategoryRes] = await Promise.all([
      this.lookupTermService.getAppTermsWrapper('ItemType').toPromise(),
      itemCode != null ? this.hospitalService.getItemCategory(itemCode).toPromise(): this.lookupTermService.getAppTermsWrapper('ItemCategory').toPromise()
    ]);

    const itemTypeList = itemTypeRes?.ItemType?.map((r: any) => r.value) || [];
    const itemCategoryList = itemCode != null? itemCategoryRes?.results?.map((r: any) => r.value) || []: itemCategoryRes?.ItemCategory?.map((r: any) => r.value) || [];

    const dataLists: { [key: string]: string[] } = {
      'Item Type': itemTypeList,
      'Item Category': itemCategoryList
    };

    // Write reference lists to API sheet
    Object.entries(dataLists).forEach(([key, list], index) => {
      apiSheet.getColumn(index + 1).values = [key, ...list];
      apiSheet.getColumn(index + 1).width = 30;
    });

    apiSheet.protect('twDevEx$123', {
      selectLockedCells: true,
      selectUnlockedCells: true
    });

    // Add dropdown validation in main sheet
    headers.forEach((header, colIndex) => {
      if (dataLists[header]) {
        const colLetter = this.getColumnLetter(Object.keys(dataLists).indexOf(header) + 1);
        const rangeAddress = `${apiSheet.name}!$${colLetter}$2:$${colLetter}$${dataLists[header].length + 1}`;

        for (let rowIndex = 2; rowIndex <= totalRecords; rowIndex++) {
          mainSheet.getCell(rowIndex, colIndex + 1).dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [rangeAddress],
            showErrorMessage: true,
            errorStyle: 'error',
            errorTitle: 'Invalid Input',
            error: 'Value must be from the list'
          };
        }
      }
    });

    // Save file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fileName);
  } catch (err) {
    this.toastr.error('Error', 'Failed to generate file.');
  } finally {
    this.loading = false;
  }
}

async itemsImport(event) {
  this.loading = true;

  try {
    const [itemTypeRes, itemCategoryRes] = await Promise.all([
      this.lookupTermService.getAppTermsWrapper('ItemType').toPromise(),
      this.lookupTermService.getAppTermsWrapper('ItemCategory').toPromise()
    ]);
    const itemTypeList = itemTypeRes.ItemType.map(({ code, value }) => ({ code, value }));
    const itemCategoryList = itemCategoryRes.ItemCategory.map(({ code, value }) => ({ code, value }));

    const file = event.target.files[0];
    if (!file) { this.loading = false; return; }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellText: false, cellDates: true });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    const headerRow = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] as string[];
    const expectedHeaders = ['Item No', 'Item Type', 'Item Category', 'Description', 'Name','Reorder Level', 'Minimum Stock Level', 'Unit of Measure','Average Cost', 'Comments'];

    if (headerRow.join(',') !== expectedHeaders.join(',')) {
      this.toastr.warning('Warning', 'Invalid column headers. Please check the file.');
      this.loading = false;
      event.target.value = null;
      return;
    }

    const arrayList = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: null, dateNF: 'yyyy-MM-dd;@' });
    const safeTrim = (value: any) => (value ? String(value).trim() : null);

    const jsonData = arrayList.map((data: any) => {
      const itemTypeValue = safeTrim(data['Item Type']);
      const itemCategoryValue = safeTrim(data['Item Category']);

      const itemType = itemTypeList.find(t => t.value?.toLowerCase() === itemTypeValue?.toLowerCase());
      const itemCategory = itemCategoryList.find(c => c.value?.toLowerCase() === itemCategoryValue?.toLowerCase());

      return {
        averageCost: safeTrim(data['Average Cost']),
        comments: safeTrim(data['Comments']),
        description: safeTrim(data['Description']),
        itemCategoryId: itemCategory ? itemCategory.code : null,
        itemNo: safeTrim(data['Item No']),
        itemTypeId: itemType ? itemType.code : null,
        minimumStockLevel: safeTrim(data['Minimum Stock Level']),
        name: safeTrim(data['Name']),
        parentId: null,
        reorderLevel: safeTrim(data['Reorder Level']),
        isActive: true,
        status: 'ITS-REC',
        totalQuantity: null,
        unitOfMeasure: safeTrim(data['Unit of Measure']),
        fileAttachments: null
      };
    })

    event.target.value = null;
    this.loading = false;
    if (!jsonData.length) {
      this.toastr.warning('Warning', 'No valid data to import.');
      return;
    }

    this.hospitalService.importBulkItems(jsonData).subscribe(
      (res: any) => {
          this.toastr.success('Success', `${res.results.note}`);
      },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
      }
    );

  } catch (err) {
    this.toastr.warning('Warning', 'Failed to load necessary data from API. Please try again later.');
    this.loading = false;
    event.target.value = null;
  }
}

async downloadOTProcedure() {
  this.loading = true;
  const headers = ['Health Plan', 'Name', 'Specialty', 'Description', 'Code Category','Code Type','Code Value','Preparation Sla','Preparation Sla End','Surgery Sla','Surgery Sla End','Recovery Sla','Recovery Sla End'];
  const mandatoryFields = ['Health Plan'];

  try {
    const workbook = new ExcelJS.Workbook();
    const mainSheet = workbook.addWorksheet('Sheet1');
    const apiSheet = workbook.addWorksheet('Sheet2');
    const headerRow = mainSheet.addRow(headers);

    headers.forEach((header, index) => {
      mainSheet.getColumn(index + 1).width = 30;
      if (mandatoryFields.includes(header)) {
        headerRow.getCell(index + 1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFCCCB' } // Light red for mandatory
        };
      }
    });

    const totalRecords = 1001;

    const [healthPlanRes, specialityRes,codeCategoryRes,codeTypeRes] = await Promise.all([
      this.commonService.getOTHealthPlan('HP-OT','').toPromise(),
      this.configurationServices.getspecialty().toPromise(),
      this.commonService.getAppTermsVerion2('ProcedureCategory').toPromise(),
      this.commonService.getAppTermsVerion2('ProcedureCodeType').toPromise(),
    ]);

    const healthPlanList = healthPlanRes.results.map(r => r.name) || [];
    const specialityList = specialityRes.results.map(r => r.name) || [];
    const codeCategoryList = codeCategoryRes.results.map(r => r.value) || [];
    const codeTypeList = codeTypeRes.results.map(r => r.value) || [];
    const dataLists: Record<string, string[]> = {
      'Health Plan': healthPlanList,
      'Specialty': specialityList,
      'Code Category':codeCategoryList,
      'Code Type':codeTypeList
    };

    Object.entries(dataLists).forEach(([key, list], index) => {
      apiSheet.getColumn(index + 1).values = [key, ...list];
      apiSheet.getColumn(index + 1).width = 30;
    });

    apiSheet.protect('twDevEx$123', {
      selectLockedCells: true,
      selectUnlockedCells: true
    });

    headers.forEach((header, colIndex) => {
      if (dataLists[header]) {
        const colLetter = this.getColumnLetter(Object.keys(dataLists).indexOf(header) + 1);
        const rangeAddress = `${apiSheet.name}!$${colLetter}$2:$${colLetter}$${dataLists[header].length + 1}`;

        for (let rowIndex = 2; rowIndex <= totalRecords; rowIndex++) {
          const cell = mainSheet.getCell(rowIndex, colIndex + 1);
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [rangeAddress],
            showErrorMessage: true,
            errorStyle: 'error',
            errorTitle: 'Invalid Input',
            error: 'Value must be from the list'
          };
        }
      }
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, 'download-OT Procedure.xlsx');
  } catch (err) {
    this.toastr.error('Error', 'Failed to generate file.');
  } finally {
    this.loading = false;
  }
}

 async OTProcedureImport(event) {
  this.loading = true;

  try {
    const [healthPlanRes, specialityRes, codeCategoryRes, codeTypeRes] = await Promise.all([
      this.commonService.getOTHealthPlan('HP-OT','').toPromise(),
      this.configurationServices.getspecialty().toPromise(),
      this.commonService.getAppTermsVerion2('ProcedureCategory').toPromise(),
      this.commonService.getAppTermsVerion2('ProcedureCodeType').toPromise(),
    ]);

    const healthPlanList = healthPlanRes.results.map(r => ({ code: r.id, value: r.name }));
    const specialityList = specialityRes.results.map(r => ({ code: r.id, value: r.name }));
    const codeCategoryList = codeCategoryRes.results.map(r => ({ code: r.code, value: r.value }));
    const codeTypeList = codeTypeRes.results.map(r => ({ code: r.code, value: r.value }));

    const file = event.target.files[0];
    if (!file) { this.loading = false; return; }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellText: false, cellDates: true });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    const headerRow = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] as string[];
    const expectedHeaders = ['Health Plan', 'Name', 'Specialty', 'Description', 'Code Category','Code Type', 'Code Value', 'Preparation Sla', 'Preparation Sla End','Surgery Sla', 'Surgery Sla End', 'Recovery Sla', 'Recovery Sla End'];

    if (headerRow.join(',') !== expectedHeaders.join(',')) {
      this.toastr.warning('Warning', 'Invalid column headers. Please check the file.');
      this.loading = false;
      event.target.value = null;
      return;
    }

    const arrayList = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: null, dateNF: 'yyyy-MM-dd;@' });
    const safeTrim = (value: any) => (value ? String(value).trim() : null);

    const jsonData = arrayList.map((data: any) => {
      const healthPlanValue = safeTrim(data['Health Plan']);
      const specialtyValue = safeTrim(data['Specialty']);
      const codeCategoryValue = safeTrim(data['Code Category']);
      const codeTypeValue = safeTrim(data['Code Type']);

      const healthPlan = healthPlanList.find(h => h.value?.toLowerCase() === healthPlanValue?.toLowerCase());
      const specialty = specialityList.find(s => s.value?.toLowerCase() === specialtyValue?.toLowerCase());
      const codeCategory = codeCategoryList.find(c => c.value?.toLowerCase() === codeCategoryValue?.toLowerCase());
      const codeType = codeTypeList.find(c => c.value?.toLowerCase() === codeTypeValue?.toLowerCase());

      return {
        healthPlanId: healthPlan ? healthPlan.code : null,
        name: safeTrim(data['Name']),
        specialtyId: specialty ? specialty.code : null,
        description: safeTrim(data['Description']),
        codeCategoryId: codeCategory ? codeCategory.code : null,
        codeTypeId: codeType ? codeType.code : null,
        codeValue: safeTrim(data['Code Value']),
        preparationSla: safeTrim(data['Preparation Sla']),
        preparationSlaEnd: safeTrim(data['Preparation Sla End']),
        surgerySla: safeTrim(data['Surgery Sla']),
        surgerySlaEnd: safeTrim(data['Surgery Sla End']),
        recoverySla: safeTrim(data['Recovery Sla']),
        recoverySlaEnd: safeTrim(data['Recovery Sla End'])
      };
    });

    event.target.value = null;
    this.loading = false;

    if (!jsonData.length) {
      this.toastr.warning('Warning', 'No valid data to import.');
      return;
    }
    this.hospitalService.importBulkOTProcedure(jsonData).subscribe(
      (res: any) => this.toastr.success('Success', `${res.results.note}`),
      error => this.toastr.error('Error', `${error.error.message}`)
    );

  } catch (err) {
    this.toastr.warning('Warning', 'Failed to load necessary data from API. Please try again later.');
    this.loading = false;
    event.target.value = null;
  }
}

async downloadsurgicalSets() {
  this.loading = true;
  const headers = ['Name', 'Description', 'Asset Name', 'Quantity'];
  const mandatoryFields = ['Name',  'Asset Name', 'Quantity'];
  try {
    const workbook = new ExcelJS.Workbook();
    const mainSheet = workbook.addWorksheet('Sheet1');
    const apiSheet = workbook.addWorksheet('Sheet2');
    const headerRow = mainSheet.addRow(headers);
    headers.forEach((header, index) => {
      mainSheet.getColumn(index + 1).width = 30;
      if (mandatoryFields.includes(header)) {
        headerRow.getCell(index + 1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFCCCB' } // light red for mandatory
        };
      }
    });

    const totalRecords = 1001;
    const [surgicalSetRes, assetRes] = await Promise.all([
      this.lookupTermService.getAppTermsWrapper('SurgicalSets').toPromise(),
      this.workflowService.getAssetModelNo().toPromise()
    ]);
    const surgicalSetList = surgicalSetRes.SurgicalSets.map(r => r.value) || [];
    const assetList = assetRes.results.map(r=> r.assetName)
    const dataLists: Record<string, string[]> = {
      'Name': surgicalSetList,
      'Asset Name':assetList
    };
    Object.entries(dataLists).forEach(([key, list], index) => {
      apiSheet.getColumn(index + 1).values = [key, ...list];
      apiSheet.getColumn(index + 1).width = 30;
    });
    apiSheet.protect('twDevEx$123', {
      selectLockedCells: true,
      selectUnlockedCells: true
    });
    headers.forEach((header, colIndex) => {
      if (dataLists[header]) {
       const colLetter = this.getColumnLetter(Object.keys(dataLists).indexOf(header) + 1);
        const rangeAddress = `${apiSheet.name}!$${colLetter}$2:$${colLetter}$${dataLists[header].length + 1}`;

        for (let rowIndex = 2; rowIndex <= totalRecords; rowIndex++) {
          const cell = mainSheet.getCell(rowIndex, colIndex + 1);
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [rangeAddress],
            showErrorMessage: true,
            errorStyle: 'error',
            errorTitle: 'Invalid Input',
            error: 'Value must be from the list'
          };
        }
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, 'download-surgicalSets.xlsx');

  } catch (err) {
    this.toastr.error('Error', 'Failed to generate  file.');
  } finally {
    setTimeout(() => { this.loading = false; });
  }
}

async surgicalSetsImport(event) {
  this.loading = true;

  try {
    const [surgicalSetRes, assetRes] = await Promise.all([
      this.lookupTermService.getAppTermsWrapper('SurgicalSets').toPromise(),
      this.workflowService.getAssetModelNo().toPromise()
    ]);

    const surgicalSetList = surgicalSetRes.SurgicalSets.map(r => ({ code: r.code, value: r.value }));
    const assetList = assetRes.results.map(r => ({ id: r.assetId, name: r.assetName }));

    const file = event.target.files[0];
    if (!file) { this.loading = false; return; }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellText: false, cellDates: true });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    const headerRow = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] as string[];
    const expectedHeaders = ['Name', 'Description', 'Asset Name', 'Quantity'];
    if (headerRow.join(',') !== expectedHeaders.join(',')) {
      this.toastr.warning('Warning', 'Invalid column headers. Please check the file.');
      this.loading = false;
      event.target.value = null;
      return;
    }

    const arrayList = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: null });
    const safeTrim = (value: any) => (value ? String(value).trim() : null);

    const flatData = arrayList.map((data: any) => {
      const nameValue = safeTrim(data['Name']);
      const descriptionValue = safeTrim(data['Description']);
      const assetNameValue = safeTrim(data['Asset Name']);
      const quantityValue = Number(data['Quantity']) || 0;

      const sterileSet = surgicalSetList.find(s => s.value?.toLowerCase() === nameValue?.toLowerCase());
      const asset = assetList.find(a => a.name?.toLowerCase() === assetNameValue?.toLowerCase());

      return {
        code: sterileSet ? sterileSet.code : nameValue,
        description: descriptionValue,
        isActive: true,
        sterileSetDetail: {
          identifyingType: 'asset',
          identifyingValue: asset ? asset.id : null,
          quantity: quantityValue,
          isActive: true
        }
      };
    });

    const groupedMap = new Map<string, { code: string; description: string; isActive : Boolean,sterileSetDetails: any[] }>();

    flatData.forEach(item => {
      if (!groupedMap.has(item.code)) {
        groupedMap.set(item.code, {
          code: item.code,
          description: item.description,
          isActive: true,
          sterileSetDetails: [item.sterileSetDetail]
        });
      } else {
        const existing = groupedMap.get(item.code)!;
        if (!existing.sterileSetDetails.some(d => d.identifyingValue === item.sterileSetDetail.identifyingValue)) {
          existing.sterileSetDetails.push(item.sterileSetDetail);
        }
      }
    });

    const jsonData = Array.from(groupedMap.values());

    event.target.value = null;
    this.loading = false;

    if (!jsonData.length) {
      this.toastr.warning('Warning', 'No valid data to import.');
      return;
    }

    this.hospitalService.importBulkSurgicalSet(jsonData).subscribe(
      (res: any) => this.toastr.success('Success', `${res.results.note || 'Imported successfully'}`),
      error => this.toastr.error('Error', `${error.error.message || 'Failed to import'}`)
    );

  } catch (err) {
    this.toastr.warning('Warning', 'Failed to load necessary data from API. Please try again later.');
    this.loading = false;
    event.target.value = null;
  }
}

  downloadTag() {
    this.loading = true;
    const headers = ['serialNumber', 'tagTypeId', 'macId', 'status', 'hwType', 'category'];
    const mandatoryFields = ['serialNumber', 'tagTypeId', 'macId', 'status', 'hwType'];
    const workbook = new ExcelJS.Workbook();
    const mainSheet = workbook.addWorksheet('Sheet1');
    const apiSheet = workbook.addWorksheet('Sheet2');

    const headerRow = mainSheet.addRow(headers);
    headers.forEach((header, index) => {
      mainSheet.getColumn(index + 1).width = 30;
    });
    headers.forEach((header, index) => {
      if (mandatoryFields.includes(header)) {
        const cell = headerRow.getCell(index + 1);
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFCCCB' }, // Light red fill
        };
      }
    });

    let hardwareTypeList = [];
    let tagTypeList = [];
    let statusList = [];
    let tagCategoryList = []

    const apiPromises = [
      this.lookupTermService.getAppTermsWrapper('TagHardwareType').toPromise().then(res => hardwareTypeList = res.TagHardwareType.map(({ value }) => value) || []),
      this.lookupTermService.getAppTermsWrapper('TagType').toPromise().then(res => tagTypeList = res.TagType.map(({ value }) => value) || []),
      this.lookupTermService.getAppTermsWrapper('Status').toPromise().then(res => statusList = res.Status.map(({ value }) => value) || []),
      this.lookupTermService.getAppTermsWrapper('TagCategory').toPromise().then(res => tagCategoryList = res.TagCategory.map(({ value }) => value) || [])
    ];

    Promise.all(apiPromises)
      .then(() => {
        return this.configurationServices.getConfigFile('excel-config').toPromise();
      })
      .then(res => {
        this.totalRecords = res?.results?.contentObject?.tag ? res.results.contentObject.tag + 1 : 1001;
        const dataLists = {
          hwType: hardwareTypeList,
          tagTypeId: tagTypeList,
          status: statusList,
          category: tagCategoryList
        };

        Object.entries(dataLists).forEach(([key, list], index) => {
          const col = index + 1;
          apiSheet.getColumn(col).values = [key, ...list];
          apiSheet.getColumn(col).width = 30;
        });

        apiSheet.protect('twDevEx$123', {
          selectLockedCells: true,
          selectUnlockedCells: true,
          formatCells: false,
          formatColumns: false,
          formatRows: false,
          insertColumns: false,
          insertRows: false,
          insertHyperlinks: false,
          deleteColumns: false,
          deleteRows: false,
          sort: false,
          autoFilter: false,
          pivotTables: false
        });

        headers.forEach((header, colIndex) => {
          if (dataLists[header]) {
            const colLetter = String.fromCharCode(65 + Object.keys(dataLists).indexOf(header)); // Column letter for data validation
            const rangeAddress = `${apiSheet.name}!$${colLetter}$2:$${colLetter}$${dataLists[header].length + 1}`; // Formula for data validation using cell range

            for (let rowIndex = 2; rowIndex <= 501; rowIndex++) { // Apply validation to 500 rows
              const cell = mainSheet.getCell(rowIndex, colIndex + 1);
              const validation = {
                type: 'list',
                allowBlank: true,
                formulae: [rangeAddress],
                showErrorMessage: true,
                errorStyle: 'error',
                errorTitle: 'Invalid Input',
                error: 'Value must be from the list',
              };
              cell.dataValidation = validation;
            }
          }
        });

        return workbook.xlsx.writeBuffer();
      })
      .then(buffer => {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        this.loading = false;
        saveAs(blob, 'download-tag.xlsx');
      });
  }

  async tagImport(event: any) {
  this.loading = true;

  try {
    const [hardwareTypeRes,tagTypeRes,statusRes,categoryRes] = await Promise.all([
      this.lookupTermService.getAppTermsWrapper('TagHardwareType').toPromise(),
      this.lookupTermService.getAppTermsWrapper('TagType').toPromise(),
      this.lookupTermService.getAppTermsWrapper('Status').toPromise(),
      this.lookupTermService.getAppTermsWrapper('TagCategory').toPromise()
    ]);

    const hardwareTypeList = hardwareTypeRes?.TagHardwareType || [];
    const tagTypeList = tagTypeRes?.TagType || [];
    const statusList = statusRes?.Status || [];
    const tagCategoryList = categoryRes?.TagCategory || [];

    const file = event?.target?.files?.[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    const headerRow = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] as string[];
    const expectedHeader = ['serialNumber', 'tagTypeId', 'macId', 'status', 'hwType', 'category'];

    const normalize = (arr: string[]) => arr.map(v => v?.toString().trim());

    if (normalize(headerRow).join(',') !== expectedHeader.join(',')) {
      this.toastr.warning('Warning', 'Invalid column headers');
      return;
    }

    const rows = XLSX.utils.sheet_to_json(worksheet, { defval: null });
    const safeTrim = (v: any) => (v ? v.toString().trim() : null);

    const jsonData = rows.map(row => {
        const tagTypeId = this.mapAppTermField(row['tagTypeId'], tagTypeList);

        return {
          serialNumber: safeTrim(row['serialNumber']),
          tagTypeId : tagTypeId,
          macId: safeTrim(row['macId']),
          status: this.mapAppTermField(row['status'], statusList),
          hwtype: this.mapAppTermField(row['hwType'], hardwareTypeList),
          tagCategoryId:tagTypeId === 'TT-IN'? this.mapAppTermField(row['category'], tagCategoryList): null
        };
      })

    if (!jsonData.length) {
      this.toastr.warning('Warning', 'No valid data to import');
      return;
    }

    this.hospitalService.saveImportTag(jsonData).subscribe({
      next: res => this.toastr.success('Success', res?.results?.note),
      error: err => this.toastr.error('Error', err?.error?.message || 'Import failed')
    });
  } catch {
    this.toastr.error('Error', 'Failed to process Tag import');
  } finally {
    this.loading = false;
    event.target.value = null;
  }
}

downloadInventory() {
  this.loading = true;
  const headers = ['itemMasterid','itemNo','batchId','expiryDate','purshaseOrderId','quantity','supplierId','unitCost','comments'];
  const mandatoryFields = ['itemMasterid','itemNo','batchId','expiryDate','purshaseOrderId','quantity','supplierId'];
  const numberFields = ['purshaseOrderId','unitCost','quantity'];
  const dateFields = ['expiryDate'];

  const workbook =new ExcelJS.Workbook();
  const mainSheet =workbook.addWorksheet('Sheet1');
  const apiSheet =workbook.addWorksheet('Sheet2');
  apiSheet.state = 'hidden';
  // Header Row
  const headerRow =mainSheet.addRow(headers);
  headerRow.font = {bold: true};
  mainSheet.views = [{state: 'frozen',ySplit: 1}];

  // Column Width + Hide First Column
  headers.forEach((header, index) => {
    const column =mainSheet.getColumn(index + 1);
    column.width = 30;
    // Hide itemMasterid column
    if (index === 0) {
      column.hidden = true;
    }
  });

  // Mandatory Field Style
  headers.forEach((header, index) => {
    if (mandatoryFields.includes(header)) {
      const cell =headerRow.getCell(index + 1);
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFCCCB' }, // Light red fill
      };
    }
  });
  let supplierList = [];
  let itemMasterList = [];
  const apiPromises = [
    this.workflowService.getAllItemMaster(null, null).toPromise().then(res => {
        itemMasterList =res?.results || [];
      }),
    this.commonService.getSupplierById(null, '').toPromise().then(res => {
        supplierList =res?.results?.map(({ name }) => name) || [];
      })
  ];

  Promise.all(apiPromises)
    .then(async () => {
      this.totalRecords =itemMasterList? itemMasterList.length + 1: 1001;
      const dataLists = {supplierId: supplierList};

      Object.entries(dataLists)
        .forEach(([key, list], index) => {
          const col =index + 1;
          apiSheet.getColumn(col).values = [key, ...list];
          apiSheet.getColumn(col).width = 30;
        });

      itemMasterList.forEach((item, index) => {
          const rowNumber =index + 2;
          mainSheet.getCell(rowNumber, 1).value =item?.id || '';
          mainSheet.getCell(rowNumber, 2).value =item?.itemNo || '';
          mainSheet.getCell(rowNumber, 1).protection = {locked: true};
          mainSheet.getCell(rowNumber, 2).protection = {locked: true};

          // Readonly mode
          ['A', 'B'].forEach(col => {
              mainSheet.getCell(`${col}${rowNumber}`).fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: {argb: 'FFEFEFEF'}
                };
            });
          // Unlock Editable Columns
          for (let col = 3;col <= headers.length;col++) {
            mainSheet.getCell(rowNumber, col).protection = {locked: false};
          }
        });

      // Apply Validations
      headers.forEach(
        (header, colIndex) => {
          for (let rowIndex = 2;rowIndex <=itemMasterList.length + 1;rowIndex++) {

            const cell =mainSheet.getCell(rowIndex,colIndex + 1);
            // Dropdown Validation
            if (dataLists[header]) {
              const dataListIndex =Object.keys(dataLists).indexOf(header);
              const colLetter =this.getColumnLetter(dataListIndex + 1);
              const rangeAddress =`${apiSheet.name}!$${colLetter}$2:$${colLetter}$${dataLists[header].length + 1}`;
              cell.dataValidation = {
                type: 'list',
                allowBlank: false,
                formulae: [rangeAddress],
                showErrorMessage: true,
                errorStyle: 'error',
                errorTitle:'Invalid Input',
                error:'Value must be selected from dropdown'
              };
            }
            // Number Validation
            if (numberFields.includes(header)) {
              cell.dataValidation = {
                type: 'decimal',
                operator:'greaterThanOrEqual',
                allowBlank: true,
                formulae: [0],
                showErrorMessage: true,
                errorStyle: 'error',
                errorTitle:'Invalid Number',
                error:'Only numeric values are allowed'
              };

            }
            // Date Validation
            if (dateFields.includes(header)) {

              cell.dataValidation = {
                type: 'date',
                operator: 'greaterThan',
                formulae: [new Date(1900, 0, 1)],
                allowBlank: true,
                showErrorMessage: true,
                errorStyle: 'stop',
                errorTitle: 'Invalid Date',
                error: 'Enter a valid date (dd-MM-yyyy)'
              };

              cell.numFmt = 'dd-mm-yyyy';

            }
          }
        });
      // Protect Main Sheet
      await mainSheet.protect('twDevEx$123',{
          selectLockedCells: true,
          selectUnlockedCells: true,
          formatCells: false,
          formatColumns: false,
          formatRows: false,
          insertColumns: false,
          insertRows: false,
          deleteColumns: false,
          deleteRows: false,
          sort: false,
          autoFilter: false,
          pivotTables: false
        }
      );
      // Protect Hidden API Sheet
      await apiSheet.protect('twDevEx$123',
        {
          selectLockedCells: true,
          selectUnlockedCells: true,
          formatCells: false,
          formatColumns: false,
          formatRows: false,
          insertColumns: false,
          insertRows: false,
          deleteColumns: false,
          deleteRows: false
}
      );
      return workbook.xlsx.writeBuffer();
    })
    .then(buffer => {
      const blob = new Blob([buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
      saveAs(blob,'download-Inventory.xlsx');
      this.loading = false;
    })
    .catch(error => {
      this.loading = false;
    });
}

  async inventoryImport(event: any) {
    this.loading = true;
    try {
      const [supplierRes] = await Promise.all([
      this.commonService.getSupplierById(null, '').toPromise()]);
      const supplierList =supplierRes?.results || [];
      const file =event?.target?.files?.[0];

      if (!file) {
        this.loading = false;
        return;
      }

      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer,{type: 'array',cellText: false,cellDates: true});
      const worksheet =workbook.Sheets[workbook.SheetNames[0]];

      const headerRow =XLSX.utils.sheet_to_json(worksheet,{ header: 1 })[0] as string[];
      const expectedHeader = ['itemMasterid','itemNo','batchId','expiryDate','purshaseOrderId','quantity','supplierId','unitCost','comments'];
      const normalizedHeaderRow =headerRow.map(h => (h ?? '').toString().trim());
      const normalizedHeader =expectedHeader.map(h => h.trim());
      if (normalizedHeaderRow.length !== normalizedHeader.length ||normalizedHeaderRow.some((val, idx) =>val !== normalizedHeader[idx])) {
        this.toastr.warning('Warning','Invalid column headers. Please check the file.');
        this.loading = false;
        event.target.value = null;
        return;
      }

      const rows = XLSX.utils.sheet_to_json(worksheet,{raw: false,rawNumbers: false,defval: null,dateNF: 'yyyy-MM-dd;@'});
      const jsonData = rows.map((row: any) => {
          const batchId = row.batchId?.toString().trim();
          const expiryDate = row.expiryDate;
          const purchaseOrderId = row.purshaseOrderId;
          const quantity = row.quantity;
          const supplierId = row.supplierId;
          const isValid = !!batchId && !!expiryDate && !!purchaseOrderId && !!quantity && !!supplierId;

          return {
            batchId: batchId ?? null,
            comments: row.comments?.toString().trim() ?? null,
            expiryDate: this.parseDate(expiryDate),
            itemMasterId: row.itemMasterid ? Number(row.itemMasterid) : null,
            purchaseOrderId: purchaseOrderId ? Number(this.formatNumberAsString(purchaseOrderId)) : null,
            quantity: quantity ? Number(this.formatNumberAsString(quantity)) : null,
            supplierId: this.mapAppTermField(row.supplierId, supplierList, 'id', 'name'),
            unitCost: row.unitCost ? Number(this.formatNumberAsString(row.unitCost)) : null,
            transactionTypeId: isValid ? 'IN' : null,
            userId: isValid ? Number(localStorage.getItem('dXNlcklk')) : null,
            statusId: isValid ? 'ITS-IST' : null,
          };
        }).filter((row: any) =>row.itemMasterId);

      this.loading = false;
      event.target.value = null;
      if (!jsonData.length) {
        this.toastr.warning('Warning','No valid inventory records found.');
        return;
      }
      this.hospitalService.importBulkInventory(jsonData).subscribe({next: (res: any) => {
            this.loading = false;
            this.toastr.success('Success', res?.results?.note );
          },
          error: (err: any) => {
            this.loading = false;
            this.toastr.error('Error',err?.error?.message 
            );
          }
        });
      this.loading = false;
    } catch (error) {
      this.loading = false;
      event.target.value = null;
      this.toastr.error('Error','Error parsing the uploaded file.');
    }
  }


async assetTermsListExist(): Promise<boolean> {
  try {
    const res = await this.configurationServices.getConfigFile('asset-config').toPromise();
    const termsList = res?.results?.contentObject?.termsList;
    this.defaultAssetStatus = res?.results?.contentObject?.createAssetStatus?.[0] ?? 'ATS-REC';
    return Array.isArray(termsList) && termsList.length > 0;
  } catch (error) {
    console.log('Error fetching hierarchy config:', error);
    return false;
  }
}

// Helper functions
  // Converts numeric values to plain string format
  formatNumberAsString = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const str = String(value).trim();
    const validExp = /^[+-]?\d+(\.\d+)?[eE]\+\d+$/;
    if (!validExp.test(str)) {
      return str;
    }
    const [mantissa, expPart] = str.split(/[eE]\+/);
    const exponent = parseInt(expPart, 10);
    const MAX_EXPANSION = 20;
    if (exponent > MAX_EXPANSION) return str;
    const [intPart, decPart = ''] = mantissa.split('.');
    const digits = intPart + decPart;
    const zerosToAdd = exponent - decPart.length;
    if (zerosToAdd >= 0) {
      return digits + '0'.repeat(zerosToAdd);
    } else {
      const pos = digits.length + zerosToAdd;
      return digits.slice(0, pos) + '.' + digits.slice(pos);
    }
  }

  //validate phoneNumber format
  formatPhoneNumber = (phone) => {
    if (!phone || phone.trim() === '') {
      return null; 
    }
    const safeTrim = (value) => value ? value.trim() : null;
    const cleaned = safeTrim(phone).replace(/['"\s]/g, ''); // Remove unwanted characters
    return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
  }

  // format PhoneNumber with CountryCode
  formatContactNumber = (code, number)=> {
    const safeTrim = (value)=> value ? value.trim() : null;
    const countryCode = safeTrim(code);
    const contact = safeTrim(number);
    if (!contact) return null;

    if (countryCode) return `${countryCode}-${contact}`;

    return contact;
  };


  //Map corresponding appterm code
  mapAppTermField = (fieldName, list, codeField = 'code', valueField = 'value') => {
    const safeTrim = (value) => value ? value.trim() : null;
    const fieldValue = safeTrim(fieldName);
    const match = list?.find(item => safeTrim(item[valueField])?.toLowerCase() === fieldValue?.toLowerCase());
    return match ? match[codeField] : null;
  }

  //To  get ExcelColumn Letter
  getColumnLetter(colIndex: number): string {
    let letter = '';
    while (colIndex > 0) {
      const mod = (colIndex - 1) % 26;
      letter = String.fromCharCode(65 + mod) + letter;
      colIndex = Math.floor((colIndex - mod) / 26);
    }
    return letter;
  }

  // Method to safely parse and format date
  parseDate(d: any): string | null {
    if (d === null || d === undefined || d === '') return null;
    const date = new Date(d);
    if (isNaN(date.getTime())) return null;
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} 00:00:00`;
  }

  //formatWarrantyPeriod combine warrantyPeriod and periodtype
  formatWarrantyPeriod(period, type) {
    if (period == null || period === '' || type == null || type === '') {
      return null;
    }
    return `${period} ${type}`;
  }

  //calculateEndDate for warranty based on commissionedon,warrantyPeriod,periodType
  calculateEndDate(commissionedOn,period,type){
    if (commissionedOn == null || commissionedOn === '' ||period == null || period === '' || type == null || type === '') {
      return null;
    }
    const months = type === 'Y'? period * 12: period;
    const startDate = new Date(commissionedOn);
    const day = startDate.getDate();
    const endDate = new Date(startDate);
    endDate.setDate(1); // reset day
    endDate.setMonth(endDate.getMonth() + months);
    const lastDayOfMonth = new Date(endDate.getFullYear(),endDate.getMonth() + 1,0).getDate();
    endDate.setDate(Math.min(day, lastDayOfMonth));
    return endDate ? this.parseDate(endDate) : null
  }

  getWarrantyValue(rawValue: any, field: 'period' | 'frequency'): any {
    if (!rawValue) return null;
    const parts = String(rawValue).trim().split(/\s+/);
    if (parts.length !== 2) return null;
    const [value, unitRaw] = parts;
    const period = Number(value);
    if (isNaN(period) || period <= 0) return null;
    const unit = unitRaw.toLowerCase();
    let frequency: 'Month' | 'Year' | null = null;
    let shortCode: 'M' | 'Y' | null = null;
    if (['m', 'month', 'months'].includes(unit)) {
      frequency = 'Month';
      shortCode = 'M';
    } else if (['y', 'year', 'years'].includes(unit)) {
      frequency = 'Year';
      shortCode = 'Y';
    } else {
      return null;
    }

    return field === 'period'? period: frequency; // Excel expects "Month" / "Year"
  }
}
