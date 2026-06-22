import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Facility, FacilityFilters } from '../../shared/models/facility.model';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FacilityService {
  private facilitiesSubject = new BehaviorSubject<Facility[]>([]);
  facilities$ = this.facilitiesSubject.asObservable();

  private activeFiltersSubject = new BehaviorSubject<FacilityFilters>({ customer_id: null, region_id: null, facility_id: null });
  activeFilters$ = this.activeFiltersSubject.asObservable();

  constructor(private auth: AuthService) {}

  async loadFacilities(): Promise<void> {
    try {
      const res = await fetch(`${environment.apiUrl}/facilities`, {
        headers: { 'Authorization': `Bearer ${this.auth.getToken()}` },
      });
      const data = await res.json();
      this.facilitiesSubject.next(data.facilities || []);
    } catch (err) {
      console.error('Failed to load facilities', err);
    }
  }

  setActiveFilters(filters: FacilityFilters): void {
    this.activeFiltersSubject.next(filters);
  }

  getActiveFilters(): FacilityFilters {
    return this.activeFiltersSubject.value;
  }

  clearFilter(): void {
    this.activeFiltersSubject.next({ customer_id: null, region_id: null, facility_id: null });
  }

  getUniqueCustomers(): { id: string, name: string }[] {
    const facilities = this.facilitiesSubject.value;
    const map = new Map<string, string>();
    for (const f of facilities) {
      if (f.customer_id) map.set(f.customer_id, f.customer_name);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }

  getUniqueRegions(customerId: string | null): { id: string, name: string }[] {
    const facilities = this.facilitiesSubject.value;
    const map = new Map<string, string>();
    for (const f of facilities) {
      if (!customerId || f.customer_id === customerId) {
        if (f.region_name) map.set(f.region_name, f.region_name);
      }
    }
    return Array.from(map.entries()).map(([name]) => ({ id: name, name }));
  }

  getUniqueFacilities(customerId: string | null, regionId: string | null): { id: string, name: string }[] {
    const facilities = this.facilitiesSubject.value;
    const map = new Map<string, string>();
    for (const f of facilities) {
      const matchCustomer = !customerId || f.customer_id === customerId;
      const matchRegion = !regionId || f.region_id === regionId || f.region_name === regionId;
      if (matchCustomer && matchRegion) {
        if (f.facility_name) map.set(f.facility_name, f.facility_name);
      }
    }
    return Array.from(map.entries()).map(([name]) => ({ id: name, name }));
  }
}
