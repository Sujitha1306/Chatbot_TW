import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FacilityService } from '../../../core/services/facility.service';
import { Facility } from '../../../shared/models/facility.model';

@Component({
  selector: 'app-facility-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './facility-filter.component.html',
})
export class FacilityFilterComponent implements OnInit {
  facilities: Facility[] = [];
  active: Facility | null = null;
  search = '';
  open = false;

  constructor(private facilitySvc: FacilityService) {
    this.facilitySvc.facilities$.subscribe(f => this.facilities = f);
    this.facilitySvc.activeFacility$.subscribe(f => this.active = f);
  }

  ngOnInit() {
    this.facilitySvc.loadFacilities();
  }

  get filtered(): Facility[] {
    if (!this.search) return this.facilities;
    const q = this.search.toLowerCase();
    return this.facilities.filter(f => f.label.toLowerCase().includes(q));
  }

  select(f: Facility) {
    this.facilitySvc.setActiveFacility(f);
    this.open = false;
    this.search = '';
  }

  clear() {
    this.facilitySvc.clearFilter();
    this.open = false;
  }
}
