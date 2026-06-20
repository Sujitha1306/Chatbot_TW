import { Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FacilityService } from '../../../core/services/facility.service';
import { FacilityFilters } from '../../../shared/models/facility.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-facility-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './facility-filter.component.html',
})
export class FacilityFilterComponent implements OnInit, OnDestroy {
  open = false;
  
  filters: FacilityFilters = { customer_id: null, region_id: null, facility_id: null };
  
  customers: { id: string, name: string }[] = [];
  regions: { id: string, name: string }[] = [];
  facilities: { id: string, name: string }[] = [];

  private sub!: Subscription;

  constructor(private facilitySvc: FacilityService, private eRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  clickout(event: Event) {
    if (this.open && !this.eRef.nativeElement.contains(event.target)) {
      this.open = false;
    }
  }

  ngOnInit() {
    this.facilitySvc.loadFacilities();
    
    this.sub = this.facilitySvc.facilities$.subscribe(() => {
      this.refreshOptions();
    });
    
    this.sub.add(this.facilitySvc.activeFilters$.subscribe(f => {
      this.filters = { ...f };
      this.refreshOptions();
    }));
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
  }
  
  get hasAnyFilter(): boolean {
    return !!(this.filters.customer_id || this.filters.region_id || this.filters.facility_id);
  }
  
  get filterLabel(): string {
    if (this.filters.facility_id) {
       const f = this.facilities.find(x => x.id === this.filters.facility_id);
       return f ? f.name : 'Facility';
    }
    if (this.filters.region_id) {
       const r = this.regions.find(x => x.id === this.filters.region_id);
       return r ? `Region: ${r.name}` : 'Region';
    }
    if (this.filters.customer_id) {
       const c = this.customers.find(x => x.id === this.filters.customer_id);
       return c ? `Customer: ${c.name}` : 'Customer';
    }
    return 'All facilities';
  }

  refreshOptions() {
    this.customers = this.facilitySvc.getUniqueCustomers();
    this.regions = this.facilitySvc.getUniqueRegions(this.filters.customer_id);
    this.facilities = this.facilitySvc.getUniqueFacilities(this.filters.customer_id, this.filters.region_id);
    
    if (this.filters.region_id && !this.regions.some(r => r.id === this.filters.region_id)) {
        this.filters.region_id = null;
    }
    if (this.filters.facility_id && !this.facilities.some(f => f.id === this.filters.facility_id)) {
        this.filters.facility_id = null;
    }
  }

  onCustomerChange() {
    this.filters.region_id = null;
    this.filters.facility_id = null;
    this.refreshOptions();
    this.applyFilters();
  }

  onRegionChange() {
    this.filters.facility_id = null;
    this.refreshOptions();
    this.applyFilters();
  }

  onFacilityChange() {
    this.applyFilters();
  }

  applyFilters() {
    this.facilitySvc.setActiveFilters(this.filters);
  }

  clear() {
    this.facilitySvc.clearFilter();
    this.open = false;
  }
}
