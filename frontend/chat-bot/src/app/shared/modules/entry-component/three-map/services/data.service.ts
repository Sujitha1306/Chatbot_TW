import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';

export interface FloorPlanData {
  // Define the structure of your floor plan data here
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private baseUrl = 'assets/three-js/';

  constructor(private http: HttpClient) { }

  getFloorPlanData(fileName: string): Promise<any> {
    return this.http.get<FloorPlanData>(`${this.baseUrl}${fileName}`)
      .pipe(
        catchError(error => {
          console.error('Error loading floor plan data:', error);
          return of(null);
        })
      )
      .toPromise();
  }
}
