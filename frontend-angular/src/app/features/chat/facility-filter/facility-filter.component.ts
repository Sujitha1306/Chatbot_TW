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
  customerOpen = false;
  regionOpen = false;
  facilityOpen = false;
  customerSearch = '';
  regionSearch = '';
  facilitySearch = '';
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
      this.closeInnerDropdowns();
    }
  }

  closeInnerDropdowns() {
    this.customerOpen = false;
    this.regionOpen = false;
    this.facilityOpen = false;
    this.customerSearch = this.getCustomerName() === 'All Customers' ? '' : this.getCustomerName();
    this.regionSearch = this.getRegionName() === 'All Regions' ? '' : this.getRegionName();
    this.facilitySearch = this.getFacilityName() === 'All Facilities' ? '' : this.getFacilityName();
  }

  ngOnInit() {
    this.facilitySvc.loadFacilities();
    
    this.sub = this.facilitySvc.facilities$.subscribe(() => {
      this.refreshOptions();
    });
    
    this.sub.add(this.facilitySvc.activeFilters$.subscribe(f => {
      this.filters = { ...f };
      this.refreshOptions();
      this.closeInnerDropdowns();
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

  get filteredCustomers() {
    if (!this.customerSearch) return this.customers;
    const term = this.customerSearch.toLowerCase();
    return this.customers.filter(c => c.name.toLowerCase().includes(term));
  }

  get filteredRegions() {
    if (!this.regionSearch) return this.regions;
    const term = this.regionSearch.toLowerCase();
    return this.regions.filter(r => r.name.toLowerCase().includes(term));
  }

  get filteredFacilities() {
    if (!this.facilitySearch) return this.facilities;
    const term = this.facilitySearch.toLowerCase();
    return this.facilities.filter(f => f.name.toLowerCase().includes(term));
  }

  getCustomerName() {
    if (!this.filters.customer_id) return 'All Customers';
    const c = this.customers.find(x => x.id === this.filters.customer_id);
    return c ? c.name : 'All Customers';
  }

  getRegionName() {
    if (!this.filters.region_id) return 'All Regions';
    const r = this.regions.find(x => x.id === this.filters.region_id);
    return r ? r.name : 'All Regions';
  }

  getFacilityName() {
    if (!this.filters.facility_id) return 'All Facilities';
    const f = this.facilities.find(x => x.id === this.filters.facility_id);
    return f ? f.name : 'All Facilities';
  }

  toggleCustomer() {
    this.customerOpen = !this.customerOpen;
    this.regionOpen = false;
    this.facilityOpen = false;
  }

  toggleRegion() {
    this.regionOpen = !this.regionOpen;
    this.customerOpen = false;
    this.facilityOpen = false;
  }

  toggleFacility() {
    this.facilityOpen = !this.facilityOpen;
    this.customerOpen = false;
    this.regionOpen = false;
  }

  selectCustomer(id: string | null, name: string = '') {
    this.filters.customer_id = id;
    this.filters.region_id = null;
    this.filters.facility_id = null;
    this.customerSearch = id ? name : '';
    this.customerOpen = false;
    this.facilitySvc.setActiveFilters(this.filters);
  }

  selectRegion(id: string | null, name: string = '') {
    this.filters.region_id = id;
    this.filters.facility_id = null;
    this.regionSearch = id ? name : '';
    this.regionOpen = false;
    this.facilitySvc.setActiveFilters(this.filters);
  }

  selectFacility(id: string | null, name: string = '') {
    this.filters.facility_id = id;
    this.facilitySearch = id ? name : '';
    this.facilityOpen = false;
    this.facilitySvc.setActiveFilters(this.filters);
  }

  clear() {
    this.filters = { customer_id: null, region_id: null, facility_id: null };
    this.customerSearch = '';
    this.regionSearch = '';
    this.facilitySearch = '';
    this.facilitySvc.clearFilter();
  }
}
