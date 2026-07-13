import { Component, Inject, Input } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { CommonService, ConfigurationService } from '../../../services';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AppToastService } from '../../../services/toaster.service';

@Component({
  selector: 'app-manage-entity-association',
  templateUrl: './manage-entity-association.component.html',
  styleUrls: ['./manage-entity-association.component.scss']
})

export class ManageEntityAssociationComponent {

  @Input() entityAssociationData: any = null;

  public associationForm: FormGroup;
  public identifyingInfo = new FormControl(null);
  public entityIdsInfo = new FormControl(null);

  public qualifier: any = null;
  public identifyingList: any = null;
  public entityTypeList: any = null;
  public qualifiers: any = null;
  public entityId: any = null;
  public entityType: any = null;

  public entityIdList: any[] = [];
  public identifyingNameList: any[] = [];
  public dataSource: any[] = [];
  public entityDataIds: any = [];

  public statusList = [{ code: true, value: 'Active' }, { code: false, value: 'Inactive' }];
  public DisplayColumn = ['Qualifier', 'Entity Type', 'Entity Id', 'Identifying Type', 'Identifying Name', 'Status', 'delete'];
  public DataColumns = ['qualifier', 'entityType', 'entityId', 'identifyingType', 'identifyingValueName', 'isActive', 'delete'];

  constructor(public form: FormBuilder, private readonly fb: FormBuilder, private readonly configurationServices: ConfigurationService,
              @Inject(MAT_DIALOG_DATA) public data: any, public commonService: CommonService, public configurationService: ConfigurationService,
              public toastr: AppToastService, public dialog: MatDialog) {
    this.getDynamicConfig();            
  }

  ngOnInit() {
    if (this.entityAssociationData != null && this.entityAssociationData != undefined) {
      this.data = null;
      this.data = this.entityAssociationData.data[0];
    }
    if (this.data) {
      this.data['identifyingValue'] = [this.data?.identifyingValue];
      this.data['entityId'] = parseInt(this.data?.entityId);
      this.data['qualifier'] = this.data.qualifier;
      this.updatedData();
    }
    if (this.data?.id) {
      this.getEntityAssociation();
    }
    if (this.entityAssociationData?.type == 'TW-FTP' && this.entityAssociationData?.formData) {
      this.getFormfieldData();
    }
    this.buildForm();
  }

  getFormfieldData() {
    const entityId = this.entityAssociationData?.formData.entityId;
    this.configurationService.getFormTemplates(entityId).subscribe(res => {
      const entityFormData = res.results;
      const keyChanges = entityFormData.map(item => ({ code: item.id, value: item.name }));
      this.entityIdList = keyChanges;
      this.entityIdsInfo.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(searchText => {
        const lower = searchText?.toLowerCase() || '';
        this.entityIdList = keyChanges?.filter(appterm => appterm.value.toLowerCase().includes(lower));
      });
      this.associationForm.get('entityId').setValue(this.entityIdList[0]?.code);
      this.associationForm.get('qualifier').setValue(entityFormData[0]?.typeName.toLowerCase());
      this.associationForm.get('entityType').setValue('pf_form_template');
    });
  }

  getDynamicConfig() {
    this.configurationServices.getConfigFile('entity-association-config').subscribe(res => {
      this.qualifier = res.results.contentObject.qualifier;
      this.identifyingList = res.results.contentObject.Identifying;
      this.entityTypeList = res.results.contentObject.entityType;
      // this.entityTypeList = this.entityAssociationData?.data ? this.entityTypeList : this.entityTypeList.filter(x => x.code != 'pf_form_template');
    });
  }

  getEntityAssociation() {
    this.qualifiers = this.data?.qualifier;
    this.entityId = this.data?.entityId;
    this.entityType = this.data?.entityType;
    this.commonService.getAssociationData(null, this.qualifiers, this.entityId, this.entityType).subscribe(res => {
      if (res.statusCode) {
        this.dataSource = res.results.map(x => ({
          ...x,
          qualifier: x.qualifier ? x.qualifier.charAt(0).toUpperCase() + x.qualifier.slice(1) : x.qualifier,
          entityType: x.entityType ? x.entityType.charAt(0).toUpperCase() + x.entityType.slice(1) : x.entityType
        }));
        this.dataSource = [...this.dataSource];
      }
    })
  }

  getEntityType(data) {
    if (data) {
      this.entityIdList = [];
      let type = data?.code == 'role' ? 'RT-RO' : data?.code == 'department' ? 'RT-DT' : 'pf_form_template';
      if (type === 'RT-RO') {
        this.getRollData(type);
      } else if (type === 'RT-DT') {
        this.getDepartment();
      } else {
        this.getEntityformList();
      }
    }
  }

  getRollData(type) {
    this.configurationService.getRecipientName('', type).subscribe(res => {
      const keyChanges = res.results.map(item => ({ code: item.id, value: item.name }));
      this.entityIdList = keyChanges;
      this.entityIdsInfo.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(searchText => {
        const lower = searchText?.toLowerCase() || '';
        this.entityIdList = keyChanges?.filter(appterm => appterm.value.toLowerCase().includes(lower));
      });
    });
  }

  getDepartment() {
    this.commonService.getAllDepartments().subscribe(res => {
      const keyChanges = res.results.map(item => ({ code: item.id, value: item.name }));
      this.entityIdList = keyChanges;
      this.entityIdsInfo.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(searchText => {
        const lower = searchText?.toLowerCase() || '';
        this.entityIdList = keyChanges?.filter(appterm => appterm.value.toLowerCase().includes(lower));
      });
    });
  }

  updatedData() {
    let type = this.data?.entityType?.toLowerCase() === 'role' ? 'RT-RO' : this.data?.entityType?.toLowerCase() === 'department' ? 'RT-DT' : 'pf_form_template';

    if (type === 'RT-RO') {
      this.getRollData(type);
    } else if (type === 'RT-DT') {
      this.getDepartment();
    } else {
      this.getEntityformList();
    }

    this.commonService.getAppTerms(this.data?.identifyingType).subscribe(res => {
      this.identifyingNameList = res.results;
    });

  }

  getEntityformList() {
    this.configurationService.getFormTemplates(this.data?.entityId).subscribe(res => {
      const keyChanges = res.results?.map(item => ({ code: item.id, value: item.name }));
      this.entityIdList = keyChanges;
      this.entityIdsInfo.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(searchText => {
        const lower = searchText?.toLowerCase() || '';
        this.entityIdList = keyChanges?.filter(appterm => appterm.value.toLowerCase().includes(lower));
      });
    });
  }

  eventAction(event) {
    if (event.key == 'delete') {
      this.deleteAction(event.data);
    }
  }

  public buildForm() {
    this.associationForm = this.form.group({
      qualifier: [this.data ? this.data?.qualifier : null, Validators.required],
      entityType: [this.data ? this.data?.entityType : null, Validators.required],
      entityId: [this.data ? this.data?.entityId : null, Validators.required],
      identifyingType: [null, Validators.required],
      identifyingName: [null, Validators.required],
      status: [true, Validators.required],
    });
  }

  getApptermsFilter(data) {
    if (data?.code !== 'manufacturer_model_assetType') {
      this.commonService.getAppTerms(data.code).subscribe(res => {
        this.identifyingNameList = res.results;
        this.identifyingInfo.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(searchText => {
          const lower = searchText?.toLowerCase() || '';
          this.identifyingNameList = res.results?.filter(appterm => appterm.value.toLowerCase().includes(lower));
        });
      });
    }
  }

  addEntityAssocaition() {
    let createAssociationData = null;
    const identifyTypeCode = this.associationForm.get('identifyingType').value;
    const entityNameCode = this.associationForm.get('entityId').value;
    const entityName = this.entityIdList.find(x => x.code == entityNameCode);
    const identifyTypeNameCode = this.associationForm.get('identifyingName').value;
    if (identifyTypeCode !== 'manufacturer_model_assetType') {
      const identifyTypeFilter = this.identifyingNameList.filter(x => identifyTypeNameCode.includes(x.code));
      createAssociationData = identifyTypeFilter.map(item => ({
        id: null,
        qualifier: this.associationForm.get('qualifier').value,
        entityType: this.associationForm.get('entityType').value,
        entityId: this.associationForm.get('entityId').value,
        entityName: entityName.value,
        identifyingType: this.associationForm.get('identifyingType').value,
        identifyingValue: item.code,
        identifyingValueName: item.value,
        isActive: this.associationForm.get('status').value
      }));
    } else {
      const identifyValueName = this.identifyingList.find(x => x.code === identifyTypeCode);
      createAssociationData = [{
        id: null,
        qualifier: this.associationForm.get('qualifier').value,
        entityType: this.associationForm.get('entityType').value,
        entityId: this.associationForm.get('entityId').value,
        entityName: entityName.value,
        identifyingType: identifyValueName.value,
        identifyingValue: this.associationForm.get('identifyingName').value,
        identifyingValueName: this.associationForm.get('identifyingName').value,
        isActive: this.associationForm.get('status').value
      }];
    }
    this.dataSource.push(...createAssociationData);
    this.dataSource = [...this.dataSource];

    if (this.data?.id || this.entityAssociationData?.type === 'TW-FTP') {
      this.associationForm.get('identifyingType').reset(null);
      this.associationForm.get('identifyingName').reset(null);
    } else {
      this.associationForm.get('qualifier').reset(null);
      this.associationForm.get('entityType').reset(null);
      this.associationForm.get('entityId').reset(null);
      this.associationForm.get('identifyingType').reset(null);
      this.associationForm.get('identifyingName').reset(null);
    }
  }

  deleteAction(event) {
    if (this.dataSource.length) {
      if (event?.id) {
        if (!this.entityDataIds.includes(event.id)) {
          this.entityDataIds.push(event.id);
        }
        this.dataSource = this.dataSource.map(x => x.id === event.id ? { ...x, isActive: !x.isActive } : x);
      } else {
        const index = this.dataSource.findIndex(x => x.entityId === event.entityId && x.entityName == event.entityName && x.entityType && event.entityType
          && x.identifyingValue == event.identifyingValue && x.qualifier === event.qualifier && x.identifyingType == event.identifyingType);
        if (index !== -1) {
          this.dataSource = this.dataSource.map((x, i) => i === index ? { ...x, isActive: !x.isActive } : x);
        }
      }
      this.dataSource = [...this.dataSource];
    }
  }

  saveAssociation() {
    let createAssociationLists: any = [];
    if (this.dataSource.length) {
      createAssociationLists = this.dataSource.filter(item => item.isActive);
    }
    // console.log(createAssociationLists);
    // return
    this.configurationService.createEntityAssociation(createAssociationLists).subscribe(res => {
      this.toastr.success('Success', `${res.message}`);
      this.dialog.closeAll();
    })
  }

  updateAssociation() {
    let updatedAssociationList: any = [];
    if (this.dataSource?.length) {
      updatedAssociationList = this.dataSource.filter(x => (this.entityDataIds?.includes(x.id) && !x.isActive) || (x.id === null && x.isActive));
    }
    // console.log(updatedAssociationList);
    // return
    this.configurationService.updateEntityAssociation(updatedAssociationList).subscribe(res => {
      this.toastr.success('Success', `${res.message}`);
      this.dialog.closeAll();
    })
  }
}
