import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, shareReplay, finalize } from 'rxjs/operators';
import { CommonService } from './services';

@Injectable({
  providedIn: 'root'
})
export class ConfigCacheService {

  // Cache store (key-based)
  private configDetails: { [key: string]: any } = {};

  // In-flight requests (avoid duplicate API calls)
  private inFlightRequests: { [key: string]: Observable<any> } = {};

  constructor(private readonly commonService: CommonService) {}

  // Get Config (returns { key: config })
  getConfig(key: string, forceRefresh: boolean = false): Observable<any> {

    // Return cached value
    if (!forceRefresh && this.configDetails[key]) {
      return of({ [key]: this.configDetails[key] }); // ✅ wrapped response
    }

    // Avoid duplicate API calls
    if (!this.inFlightRequests[key] || forceRefresh) {

      this.inFlightRequests[key] = this.commonService
        .getConfigFile(key)
        .pipe(

          // Extract actual config
          map((res: any) => res?.results?.contentObject),

          // Store in cache + wrap response
          map(config => {
            if (config) {
              this.configDetails[key] = config;
            }
            return { [key]: config }; // wrapped response
          }),

          // Cleanup after completion
          finalize(() => {
            delete this.inFlightRequests[key];
          }),

          // Share response across subscribers
          shareReplay(1)
        );
    }

    return this.inFlightRequests[key];
  }

  // Get cached config directly (NO wrapping)
  getCachedConfig(key: string): any {
    return this.configDetails[key] || null;
  }

  // Get cached config WITH wrapping
  getCachedConfigWithKey(key: string): any {
    if (this.configDetails[key]) {
      return { [key]: this.configDetails[key] };
    }
    return null;
  }

  // Clear specific cache
  clearCache(key: string): void {
    delete this.configDetails[key];
  }

  // Clear all cache
  clearAllCache(): void {
    this.configDetails = {};
    this.inFlightRequests = {};
  }
}