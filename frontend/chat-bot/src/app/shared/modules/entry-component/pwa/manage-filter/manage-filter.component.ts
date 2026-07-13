import { Component, OnInit, Inject, Optional } from '@angular/core';
import { FormControl } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { MY_FORMATS } from '../../confirmation-dialog/confirmation-dialog.component';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';

@Component({
  selector: 'app-manage-filter',
  templateUrl: './manage-filter.component.html',
  styleUrls: ['./manage-filter.component.scss'],
  providers: [{ provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
             { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS }]
})
export class ManageFilterComponent implements OnInit {
  selectedValue = [];
  searchInputs = {};
  filteredOptions = {};
  groupFilter: any[] = [];
  showDateFilter : Date = null;
  dateControl = new FormControl();
  constructor(
    @Optional() public bottomSheetRef: MatBottomSheetRef<ManageFilterComponent>,
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: any,
    public datepipe: DatePipe,
  ) {
  }

  ngOnInit() {
    // console.log(this.data)
    this.groupFilter = this.data;
    this.showDateFilter = this.data?.showDateFilter ?? null;
    this.groupFilter.forEach(filter => {
      this.filteredOptions[filter.id] = [...filter.subFilters];
    });
    this.initializeSelectedValues();

    if (this.showDateFilter) {
      this.dateControl.setValue(this.showDateFilter);
    }
  }

  initializeSelectedValues() {
    this.selectedValue = [];
    this.groupFilter.forEach(filter => {
      if (filter.defaultSelected && filter.defaultSelected.includes('All')) {
        if (filter.isAll && filter.subFilters?.length > 0) {
          filter.subFilters.forEach(sub => {
            this.selectedValue.push({ id: filter.id, data: sub.code });
          });
        }
        if (filter.isNoneAll) {
          this.selectedValue.push({ id: filter.id, data: 'All' });
        }
      }
      filter.defaultSelected?.forEach(code => {
        const found = filter.subFilters.find(sub => sub.code === code);
        if (found) {
          this.selectedValue.push({ id: filter.id, data: found.code });
        }
      });
    });
    this.selectedValue = this.selectedValue.filter(
      (v, i, a) => a.findIndex(t => t.id === v.id && t.data === v.data) === i
    );
  }

  isFilterDisabled(filterId: string): boolean {
    if (filterId === 'my department' || filterId === 'ownership') {
      return !this.selectedValue.some(v =>(v.id === 'asset' || v.id === 'department') && v.data === 'myDepartment');
    }
    return false;
  }

  selectedFilter(filterId, code) {
    if (this.isFilterDisabled(filterId)) return;

    const filterInfo = this.groupFilter.find(f => f.id === filterId);
    if (!filterInfo) return;

    if (filterInfo.selectionType === 'single') {
      this.selectedValue = this.selectedValue.filter(val => val.id !== filterId);
    }

    const index = this.selectedValue.findIndex(val => val.id === filterId && val.data === code);
    const existing = this.selectedValue.filter(val => val.id === filterId);

    if (index === -1) {
      this.selectedValue.push({ id: filterId, data: code });
    } else {
      if (!(filterInfo.enableEmpty === false && existing.length === 1)) {
        this.selectedValue.splice(index, 1);
      }
    }

    this.selectedValue = this.selectedValue.filter((v, i, a) => a.findIndex(t => t.id === v.id && t.data === v.data) === i);
    if (filterInfo.dependentFilter?.length > 0) {
      for (const depId of filterInfo.dependentFilter) {
        const depFilter = this.groupFilter.find(f => f.id === depId);
        const depAlready = this.selectedValue.some(v => v.id === depId);
        if (!depAlready && depFilter) {
          depFilter.subFilters.forEach(sub => {
            this.selectedValue.push({ id: depId, data: sub.code });
          });
        }
      }
    }
  }

  selectAllFilters(filterId: string) {
    if (this.isFilterDisabled(filterId)) return;

    const filter = this.groupFilter.find(f => f.id === filterId);
    if (!filter) return;

    const isAllSelected = this.checkIfAllSelected(filterId);

    if (!isAllSelected) {
      filter.subFilters.forEach(sub => {
        const already = this.selectedValue.some(val => val.id === filterId && val.data === sub.code);
        if (!already) {
          this.selectedValue.push({ id: filterId, data: sub.code });
        }
      });
    } else {
      this.selectedValue = this.selectedValue.filter(val => val.id !== filterId);
    }
    this.selectedValue = this.selectedValue.filter((v, i, a) => a.findIndex(t => t.id === v.id && t.data === v.data) === i);
  }

  checkIfAllSelected(filterId: string): boolean {
    const filter = this.groupFilter.find(f => f.id === filterId);
    if (!filter) return false;

    return filter.subFilters.every(sub =>
      this.selectedValue.some(val => val.id === filterId && val.data === sub.code)
    );
  }

  isSelected(filterId, code) {
    return this.selectedValue.some(val => val.id === filterId && val.data === code);
  }

  onSearch(groupId: string) {
    const filter = this.groupFilter.find(f => f.id === groupId);
    const query = this.searchInputs[groupId]?.toLowerCase() || '';
    this.filteredOptions[groupId] = filter.subFilters.filter(sub =>
      sub.value.toLowerCase().includes(query)
    );
  }

  getVisibleSelected(filterId: string) {
    const filter = this.groupFilter.find(f => f.id === filterId);
    if (!filter) return [];
    const selectedCodes = this.selectedValue.filter(sel => sel.id === filterId).map(sel => sel.data);
    return filter.subFilters.filter(sub => selectedCodes.includes(sub.code));
  }

  getFilteredOptions(filterId) {
    return (this.filteredOptions[filterId] || []).filter(
      option => !this.isSelected(filterId, option.code)
    );
  }

  applyFilters() {
    const result = {};

    this.groupFilter.forEach(filter => {
      const selected = this.selectedValue.filter(v => v.id === filter.id).map(v => v.data);

      filter.defaultSelected = selected;
      result[filter.id] = selected;
    });

    if (this.dateControl.value) {
      result['selectedDate'] = this.datepipe.transform(this.dateControl.value, 'yyyy-MM-dd');
    }
    this.bottomSheetRef.dismiss(result);
  }
  fixClick() {
    console.log('')
  }
}
