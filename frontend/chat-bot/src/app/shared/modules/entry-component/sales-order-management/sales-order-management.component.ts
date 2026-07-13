import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { CommonService, ConfigurationService, WorkflowService } from '../../../services';
import { DatePipe } from '@angular/common';
import { manageSalesOrder } from './sales-order-management.model';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ApptermsService } from '../../../services/appterms.service';
import { ConfirmDialogComponent } from '../layout-save/layout-save.component';
import { DateAdapter } from 'angular-calendar';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MY_FORMATS } from '../routine-history/routine-history.component';
import { AppToastService } from '../../../services/toaster.service';
@Component({
  selector: 'app-sales-order-management',
  templateUrl: './sales-order-management.component.html',
  styleUrls: ['./sales-order-management.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [DatePipe,
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class SalesOrderManagementComponent implements OnInit {
  public salesOrder: manageSalesOrder;
  salesOrderForm: FormGroup;
  searchControl = new FormControl('');
  public subOrderDeliveryList: any[] = [];
  public deliveryDetailsData: any[] = [];
  public expandedIndex: number | null = null;
  itemList: any;
  itemListMaster: any[] = []
  itemEnabled: boolean = false;
  subOrderList: any[];
  subOrderListMaster: any[] = [];
  selectedItems: any[] = [];
  selectedUpdateItems: any[];
  currentTime = new Date();
  countrycodeList: any[] = [];
  countrycodeListMaster: any[] = [];
  departmentList: any;
  userList: any;
  depEnable = false;
  userEnable = false;
  orderData: any;
  existSubOrderItems: any[];
  suborderItemIds: any[];
  subIndexOrderItems: { [index: number]: number[] } = {};
  isUpdateAdd: boolean = false;

  constructor(private readonly fb: FormBuilder, private readonly workflowService: WorkflowService, private readonly dateFormat: DatePipe,
    private readonly commonService: CommonService, public toastr: AppToastService, public dialogRef: MatDialogRef<SalesOrderManagementComponent>,
    private readonly apptermsService: ApptermsService, @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly configurationService: ConfigurationService, public dialog: MatDialog,) { }

  ngOnInit(): void {
    this.buildForm()
    this.getItemSelection()
    this.commonService.getAppTermsVerion2('CountryCode').subscribe(res => {
      this.countrycodeList = res.results;
      this.countrycodeListMaster = res.results;
    });

    if (this.data && this.data.id && this.data.type !== 'task') {
      this.getSalesOrderById(this.data.id);
    } else if (this.data && this.data.id && this.data.type === 'task') {
      this.getSalesOrderById(this.data.deliveryRequestId);
    }
    this.salesOrderForm.get('itemMasterId')?.valueChanges.subscribe(values => {
      values.forEach((v, i) => {
        this.deliveryDetailsData[i].itemMasterId = v.itemMasterId;
      });
    });

  }

  buildForm(): void {
    this.salesOrderForm = this.fb.group({
      deliveryRequestTypeId: [this.orderData?.deliveryRequestTypeId ? this.orderData?.deliveryRequestTypeId : "DRT-SAOR"],
      deliveryStatusId: [this.orderData?.deliveryStatusId ? this.orderData?.deliveryStatusId : "DLS-PEN"],
      identifier: [this.orderData?.identifier ? this.orderData?.identifier : null, [Validators.required]],
      description: [this.orderData?.description ? this.orderData?.description : null],
      purchaser: [this.orderData?.purchaser ? this.orderData?.purchaser : null],
      countryCode: [this.orderData?.countryCode ? this.orderData?.countryCode : 'India'],
      comments: [this.orderData?.comments ? this.orderData?.comments : null],
      requestUserDepartmentId: [this.orderData?.requestUserDepartmentName ? this.orderData?.requestUserDepartmentName : null, [Validators.required, this.validateDepatmentSelection.bind(this)]],
      requestedByUserId: [this.orderData?.requestedByUserName ? this.orderData?.requestedByUserName : null, [this.validateUserSelection.bind(this)]],
      subOrderItemId: [null],
      itemMasterId: [null],
      deliveredDatetime: [this.orderData?.deliveredDatetime ? this.dateFormat.transform(this.orderData?.deliveredDatetime, 'yyyy-MM-dd') : null],
      details: this.fb.array([])
    });
  }

  private validateDepatmentSelection(control: FormControl): { [key: string]: any } | null {
    const selectedId = control.value;
    if (selectedId) {
      if (!this.departmentList || this.departmentList.length === 0) {
        return { invalidDepartment: true };
      }

      let selectedPatient = this.departmentList.find(val => val.id === selectedId || val.name === selectedId);
      if (!selectedPatient) {
        return { invalidDepartment: true };
      }
    }
    return null;
  }

  private validateUserSelection(control: FormControl): { [key: string]: any } | null {
    const selectedId = control.value;
    if (selectedId) {
      if (!this.userList || this.userList.length === 0) {
        return { invalidUser: true };
      }

      let selectedPatient = this.userList.find(val => val.id === selectedId || val.name === selectedId);
      if (!selectedPatient) {
        return { invalidUser: true };
      }
    }
    return null;
  }

  bindDepartmentList(id) {
    if (id) {
      const department = this as any as { id: string, name: string }[];
      const matched = department.find(obj => obj.id === id || obj.name === id);
      return matched ? matched.name : '';
    } else {
      return '';
    }
  }

  get details(): FormArray {
    return this.salesOrderForm.get('details') as FormArray;
  }

  applySearch(data, type): void {
    if (type === 'subItem') {
      const filterValue = (data || '').toLowerCase();
      this.subOrderList = this.subOrderListMaster.filter(item =>
        item.name?.toLowerCase().includes(filterValue)
      );
    } else if (type === 'country') {
      const filterValue = (data || '').toLowerCase();
      this.countrycodeList = this.countrycodeListMaster.filter(item =>
        item.code?.toString().toLowerCase().includes(filterValue) ||
        item.value?.toLowerCase().includes(filterValue)
      );
    } else {
      const filterValue = (data || '').toLowerCase();
      this.itemList = this.itemListMaster.filter(item =>
        item.name?.toLowerCase().includes(filterValue)
      );
    }
  }

  clearSubOrders() {
    this.salesOrderForm.get('itemMasterId').setValue(null);
    this.salesOrderForm.get('subOrderItemId').setValue(null);
    this.salesOrderForm.get('subOrderItemId')?.markAsPristine();
    this.selectedItems = [];
    this.suborderItemIds = [];
    this.subOrderDeliveryList = [];
  }

  addChildDeliveryInfo() {
    if (this.selectedItems?.length) {
      const exisDeliveryList = this.subOrderDeliveryList.filter(d =>
        this.selectedItems.some(s => s.id === d.itemMasterId)
      );
      this.selectedItems.forEach(item => {
        const exists = exisDeliveryList.some(d => d.itemMasterId === item.id);
        if (!exists) {
          this.subOrderDeliveryList.push({
            itemMasterId: item.id,
            itemMasterName: item.name,
            itemNo: item.itemNo,
            status: true,
            deliveredDatetime: this.dateFormat.transform(this.salesOrderForm.controls['deliveredDatetime'].value, 'yyyy-MM-dd HH:mm:ss'),
            batchId: null,
            requestedQuantity: null,
            additionalAttributes: null
          });
        }
      });
    }
    this.addDeliveryDetails();
  }

  addDeliveryDetails() {
    let subOrderId = this.salesOrderForm.controls['subOrderItemId'].value
    const subOrder = this.subOrderList.find(f => f.id === subOrderId)
    let deliveryData = {
      itemMasterId: this.salesOrderForm.controls['subOrderItemId'].value,
      itemMasterName: subOrder ? subOrder.name : null,
      deliveredDatetime: this.dateFormat.transform(this.salesOrderForm.controls['deliveredDatetime'].value, 'yyyy-MM-dd HH:mm:ss'),
      batchId: null,
      requestedQuantity: null,
      additionalAttributes: null,
      status: true,
      deliveryDetails: this.subOrderDeliveryList
    }
    this.deliveryDetailsData.push(deliveryData);
    const detailsArray = this.salesOrderForm.get('details') as FormArray;
    detailsArray.push(
      this.fb.group({
        itemMasterId: [deliveryData.itemMasterId],
      })
    );
    this.subOrderDeliveryList = [];
    this.selectedItems = []
    this.suborderItemIds = []
    this.salesOrderForm.get('itemMasterId').setValue(null);
    this.salesOrderForm.get('subOrderItemId').setValue(null)
    this.salesOrderForm.get('itemMasterId')?.markAsPristine();
    this.salesOrderForm.get('subOrderItemId')?.markAsPristine();
    this.existSubOrderItems = this.deliveryDetailsData.map(d => d.itemMasterId)
    this.deliveryDetailsData.forEach((parent, i) => {
      const childIds = parent.deliveryDetails?.map(d => d.itemMasterId) || [];
      this.subIndexOrderItems[i] = childIds;
    });
  }

  getItemSelection() {
    this.workflowService.getAllIterm().subscribe(res => {
      this.subOrderList = res.results.filter(f => f.itemTypeId === 'IT-SOD');
      this.subOrderListMaster = [...this.subOrderList];
      this.itemList = res.results.filter(f => f.itemTypeId !== 'IT-SOD');
      this.itemListMaster = [...this.itemList]
    })
  }

  getRequestIds(event, type) {
    let text = event.text;
    if (text.length == 0 || text === null) {
      text = null
    }
    if (type === 'department') {
      this.commonService.getAllDepartments(text).subscribe(res => {
        this.departmentList = res.results;
        this.depEnable = true;
      });
    } else {
      this.configurationService.getRoleUser(text, null, null).subscribe(res => {
        this.userList = res.results;
        this.userEnable = true;
      });
    }
  }

  getSubOrder(event) {
    this.expandedIndex = null
    this.workflowService.getSubOrderById(event.value).subscribe(res => {
      this.suborderItemIds = []
      let subOrderData = res.results
      if (subOrderData) {
        subOrderData.forEach(sub => {
          this.subOrderDeliveryList.push({
            itemMasterId: sub.id,
            itemMasterName: sub.name,
            status: sub.isActive,
            deliveredDatetime: this.dateFormat.transform(this.salesOrderForm.controls['deliveredDatetime'].value, 'yyyy-MM-dd HH:mm:ss'),
            batchId: null,
            requestedQuantity: null,
            additionalAttributes: null
          });
        })
      }
      if (this.subOrderDeliveryList?.length) {
        let subOrderId = this.salesOrderForm.controls['subOrderItemId'].value;
        this.suborderItemIds = this.subOrderDeliveryList.map(d => d.itemMasterId);
        this.suborderItemIds = [...this.suborderItemIds, subOrderId]
      }
    })
  }

  additionalItemMaster(event) {
    let selectedItemId = event.value
    this.selectedItems = this.itemList.filter(item => selectedItemId.includes(item.id))
  }

  newtriggerAction(event) {
    if (event.key === 'delete') {
      let item = event.data
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        panelClass: ['confirmation-popup'],
        data: {
          title: 'Confirmation',
          message: 'Do you want to remove this item?',
          buttonText: {
            ok: 'Yes',
            cancel: 'No'
          }
        }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result == 'Yes') {
          if (this.selectedItems?.length) {
            this.selectedItems = this.selectedItems.filter(
              s => s?.id !== item.itemMasterId
            );
          }
          this.subOrderDeliveryList = this.subOrderDeliveryList.filter(
            d => d?.itemMasterId !== item.itemMasterId
          );
          if (this.suborderItemIds?.length) {
            this.suborderItemIds = this.suborderItemIds.filter(d => d !== item.itemMasterId);
          }
          const currentValues: number[] = this.salesOrderForm.get('itemMasterId')?.value || [];
          const updatedValues = currentValues.filter(
            (id: number) => id !== item.itemMasterId
          );
          this.salesOrderForm.get('itemMasterId')?.setValue(updatedValues);
        }
      });
    }
  }

  // Added Sub Orders

  togglePanel(index: number): void {
    this.expandedIndex = this.expandedIndex === index ? null : index;
    this.selectedUpdateItems = [];
    this.isUpdateAdd = false;
  }

  subOrderStatus(detailIndex: number, event) {
    this.deliveryDetailsData[detailIndex].status = event;
  }

  updateItemMaster(event) {
    let selectedItemId = event.value;
    if(selectedItemId?.length) {
      this.isUpdateAdd = true;
    } else {
      this.isUpdateAdd = false;
    }
    this.selectedUpdateItems = this.itemList.filter(item => selectedItemId.includes(item.id))
  }

  updateChildDeliveryInfo(detailIndex: number, existData: any[]) {
    existData = existData.filter(d =>
      this.selectedUpdateItems.some(s => s.id === d.itemMasterId)
    );

    const newItems = this.selectedUpdateItems
      .filter(item => !existData.some(d => d.itemMasterId === item.id))
      .map(item => ({
        itemMasterId: item.id,
        itemMasterName: item.name,
        itemNo: item.itemNo,
        status: true,
        deliveredDatetime: this.dateFormat.transform(this.salesOrderForm.controls['deliveredDatetime'].value, 'yyyy-MM-dd HH:mm:ss'),
        batchId: null,
        requestedQuantity: null,
        additionalAttributes: null
      }));

    const updatedDetail = {
      ...this.deliveryDetailsData[detailIndex],
      deliveryDetails: [...this.deliveryDetailsData[detailIndex].deliveryDetails, ...newItems]
    };

    this.deliveryDetailsData = this.deliveryDetailsData.map((d, i) =>
      i === detailIndex ? updatedDetail : d
    );
    this.deliveryDetailsData.forEach((parent, i) => {
      const childIds = parent.deliveryDetails?.map(d => d.itemMasterId) || [];
      this.subIndexOrderItems[i] = childIds;
    });
  }


  updateTriggerAction(detailIndex: number, event) {
    let item = event.data
    if (event.key === 'delete') {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        panelClass: ['confirmation-popup'],
        data: {
          title: 'Confirmation',
          message: 'Do you want to remove this item?',
          buttonText: {
            ok: 'Yes',
            cancel: 'No'
          }
        }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result == 'Yes') {
          if (item.hasOwnProperty('id') && item.id) {
            const deletedData = this.deliveryDetailsData[detailIndex].deliveryDetails.find(f => f.id === item.id)
            if (deletedData) {
              deletedData.status = false;
            }
          } else {
            this.deliveryDetailsData[detailIndex].deliveryDetails =
              this.deliveryDetailsData[detailIndex].deliveryDetails.filter(
                d => d.itemMasterId !== item.itemMasterId
              );
            this.deliveryDetailsData.forEach((parent, i) => {
              const childIds = parent.deliveryDetails?.map(d => d.itemMasterId) || [];
              this.subIndexOrderItems[i] = childIds;
            });
          }
        }
      });
    } else if (event.key === 'undo') {
      if (!item.status) {
        const undoData = this.deliveryDetailsData[detailIndex].deliveryDetails.find(f => f.id === item.id)
        if (undoData) {
          undoData.status = true;
        }
      }
    }
  }

  getSalesOrderById(id) {
    this.workflowService.getAllDeliveryById(id).subscribe(res => {
      this.orderData = res?.results;
      if (this.orderData) {
        this.buildForm();
        this.deliveryDetailsData = [...this.orderData.deliveryDetails];
        this.existSubOrderItems = this.deliveryDetailsData.map(d => d.itemMasterId)
        if (this.orderData.deliveryDetails?.length) {
          const detailsArray = this.salesOrderForm.get('details') as FormArray;
          this.orderData.deliveryDetails.forEach((deliveryData: any) => {
            detailsArray.push(
              this.fb.group({
                itemMasterId: [deliveryData.itemMasterId],
              })
            );
          });
        }
        this.deliveryDetailsData.forEach((parent, i) => {
          const childIds = parent.deliveryDetails?.map(d => d.itemMasterId) || [];
          this.subIndexOrderItems[i] = childIds;
        });
        if (this.orderData.requestUserDepartmentId) {
          this.commonService.getAllDepartments().subscribe(res => {
            this.departmentList = res.results;
            this.depEnable = true;
            const departmentId = this.departmentList.find(f => f.id === this.orderData.requestUserDepartmentId)
            if (departmentId) {
              this.salesOrderForm.get('requestUserDepartmentId').setValue(departmentId.name)
              this.salesOrderForm.get('requestUserDepartmentId').updateValueAndValidity()
            }
          });
        }
        if (this.orderData.requestedByUserId) {
          this.configurationService.getRoleUser(null, null, null, this.orderData.requestedByUserId).subscribe(res => {
            this.userList = res.results;
            this.userEnable = true;
            this.salesOrderForm.get('requestedByUserId').setValue(this.orderData.requestedByUserName)
            this.salesOrderForm.get('requestedByUserId').updateValueAndValidity()
          });
        }
        if (this.orderData?.deliveryStatusId === 'DLS-DLD') {
          this.salesOrderForm.disable({ emitEvent: false });
        }
      }
    })
  }

  saveSalesOrder() {
    this.salesOrder = new manageSalesOrder(null, null, null, null, null, null, null, null, null, null, null)
    this.salesOrder.deliveryRequestTypeId = this.salesOrderForm.controls['deliveryRequestTypeId'].value;
    this.salesOrder.identifier = this.salesOrderForm.controls['identifier'].value;
    this.salesOrder.description = this.salesOrderForm.controls['description'].value;
    this.salesOrder.comments = this.salesOrderForm.controls['comments'].value;
    this.salesOrder.purchaser = this.salesOrderForm.controls['purchaser'].value;
    this.salesOrder.countryCode = this.salesOrderForm.controls['countryCode'].value;
    this.salesOrder.requestUserDepartmentId = this.salesOrderForm.controls['requestUserDepartmentId'].value;
    this.salesOrder.requestedByUserId = this.salesOrderForm.controls['requestedByUserId'].value;
    this.salesOrder.deliveryStatusId = this.salesOrderForm.controls['deliveryStatusId'].value;
    this.salesOrder.deliveredDatetime = this.dateFormat.transform(this.salesOrderForm.controls['deliveredDatetime'].value, 'yyyy-MM-dd HH:mm:ss'),
    this.salesOrder.deliveryDetails = this.deliveryDetailsData;
    this.commonService.createRequestDelivery(this.salesOrder).subscribe(res => {
      if (res.statusCode === 1) {
        this.toastr.success('Success', `${res.message}`);
        this.dialogRef.close('confirm');
      }
    }, error => {
      this.toastr.error('Error', `${error.error.message}`);
    });
  }

  updateSalesOrder() {
    let userId = typeof this.salesOrderForm.controls['requestedByUserId'].value === 'string' ?
      this.orderData.requestedByUserId : this.salesOrderForm.controls['requestedByUserId'].value
    let departmentId = typeof this.salesOrderForm.controls['requestUserDepartmentId'].value === 'string' ?
      this.orderData.requestUserDepartmentId : this.salesOrderForm.controls['requestUserDepartmentId'].value
    this.salesOrder = new manageSalesOrder(null, null, null, null, null, null, null, null, null, null, null);
    this.salesOrder.deliveryRequestTypeId = this.salesOrderForm.controls['deliveryRequestTypeId'].value;
    this.salesOrder.identifier = this.salesOrderForm.controls['identifier'].value;
    this.salesOrder.description = this.salesOrderForm.controls['description'].value;
    this.salesOrder.comments = this.salesOrderForm.controls['comments'].value;
    this.salesOrder.purchaser = this.salesOrderForm.controls['purchaser'].value;
    this.salesOrder.countryCode = this.salesOrderForm.controls['countryCode'].value;
    this.salesOrder.requestUserDepartmentId = departmentId;
    this.salesOrder.requestedByUserId = userId;
    this.salesOrder.deliveryStatusId = this.salesOrderForm.controls['deliveryStatusId'].value;
    this.salesOrder.deliveredDatetime = this.dateFormat.transform(this.salesOrderForm.controls['deliveredDatetime'].value, 'yyyy-MM-dd HH:mm:ss'),
    this.salesOrder.deliveryDetails = this.deliveryDetailsData;
    this.commonService.modifyRequestDelivery(this.data.id, this.salesOrder).subscribe(res => {
      if (res.statusCode === 1) {
        this.toastr.success('Success', `${res.message}`);
        this.dialogRef.close('confirm');
      }
    }, error => {
      this.toastr.error('Error', `${error.error.message}`);
    });
  }
}
