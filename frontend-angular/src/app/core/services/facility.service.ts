import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Facility } from '../../shared/models/facility.model';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FacilityService {
  private facilitiesSubject = new BehaviorSubject<Facility[]>([]);
  facilities$ = this.facilitiesSubject.asObservable();

  private activeFacilitySubject = new BehaviorSubject<Facility | null>(null);
  activeFacility$ = this.activeFacilitySubject.asObservable();

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

  setActiveFacility(facility: Facility | null): void {
    this.activeFacilitySubject.next(facility);
  }

  getActiveFacilityId(): string | null {
    return this.activeFacilitySubject.value?.facility_id || null;
  }

  clearFilter(): void {
    this.activeFacilitySubject.next(null);
  }
}
