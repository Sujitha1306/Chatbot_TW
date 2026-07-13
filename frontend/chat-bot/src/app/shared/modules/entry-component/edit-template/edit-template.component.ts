import { Component, Input } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatMenu } from '@angular/material/menu';
import { CommonService } from '../../../services/common.service';

@Component({
  selector: 'app-edit-template',
  templateUrl: './edit-template.component.html',
  styleUrls: ['./edit-template.component.scss']
})
export class EditTemplateComponent {

  @Input() editTemplateData: any;
  @Input() editContainer!: MatMenu;

  public DynamicForm: FormGroup;

  constructor(public form: FormBuilder, public commonService: CommonService) { };

  ngOnInit() {
    this.DynamicForm = this.form.group({});
    this.createDynamicForm();
  }

  createDynamicForm() {
    this.editTemplateData?.fieldData.forEach(field => {
      let defaultValue = null;
      if (field.fieldType === 'select') {

        field.filteredOptions = this.getDataList(field);
        field.originalOptions = [...field.filteredOptions];

        if (field.modifyName) {
          let found = null;
          if (Array.isArray(field.filteredOptions)) {
            found = field.filteredOptions.find(x =>
              (typeof x.value === 'string' && x.value.toLowerCase()?.trim() === field.modifyName.toLowerCase()?.trim()) ||
              (typeof x.code === 'string' && x.code.toLowerCase()?.trim()  === field.modifyName.toLowerCase()?.trim()) ||
              (typeof x.name === 'string' && x.name.toLowerCase()?.trim()  === field.modifyName.toLowerCase()?.trim())
            );
          }

          if (found) {
            defaultValue = found.code
          }
        }
      }
      this.DynamicForm.addControl(
        field.formControlName,
        new FormControl({ value: defaultValue, disabled: field.disable })
      );
      if (field.fieldType === 'select') {
        field.searchControl = new FormControl('');
        field.originalOptions = [...field.filteredOptions];
        field.searchControl.valueChanges.subscribe(value => {
          const search = (value ?? '').toLowerCase();
          setTimeout(() => {
            if (!search) {
              field.filteredOptions = [...field.originalOptions];
              return;
            }
            field.filteredOptions = field.originalOptions.filter(opt => (opt.value ?? opt.name ?? opt.code ?? '').toLowerCase().includes(search));
          });
        });
      }
    });
  }

  getDataList(field, key?) {
    const type = key ? key : field.modifyType;
    if (field.modifyType && field.modifyName) {
      if (type === 'RT-RO') return [...field.optionData.roleList];
      if (type === 'RT-DT') return [...field.optionData.departmentList];
      if (type === 'RT-US') return [...field.optionData.userList];
    }
    return Array.isArray(field.optionData) ? [...field.optionData] : [];
  }

  onChangeFieldData(data) {
    let type = data?.code;
    this.editTemplateData?.fieldData.forEach(field => {
      field.filteredOptions = this.getDataList(field, type);
      field.originalOptions = [...field.filteredOptions];
    });
  }

  saveAction() {
    const jsonData = this.editTemplateData?.fieldData.map(field => {
      const controlValue = this.DynamicForm.get(field.formControlName)?.value;
      let selectedOptionName = null;

      if (field.filteredOptions && Array.isArray(field.filteredOptions)) {
        const found = field.filteredOptions.find(opt => opt.code === controlValue);
        selectedOptionName = found ? (found.value ?? found.name ?? null) : null;
      }

      return {
        formControlName: field.formControlName ?? null,
        value: controlValue ?? null,
        modifyType: field.modifyType ?? null,
        tableData: field.tableData ?? null,
        modifyName: selectedOptionName ?? null,
        id : field.id ?? null
      };
    });
    this.commonService.shareEditedData(jsonData);
    this.editContainer.closed.emit();
  }

  closeMenu() {
    this.editContainer.closed.emit();
  }

}
