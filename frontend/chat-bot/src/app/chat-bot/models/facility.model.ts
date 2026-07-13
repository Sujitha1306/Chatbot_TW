export interface Facility {
  facility_id: string;
  facility_name: string;
  region_id: string;
  region_name: string;
  customer_id: string;
  customer_name: string;
  label: string;
}

export interface FacilityFilters {
  customer_id: string | null;
  region_id: string | null;
  facility_id: string | null;
}
