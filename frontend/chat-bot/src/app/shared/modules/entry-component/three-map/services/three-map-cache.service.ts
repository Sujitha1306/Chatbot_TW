import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { finalize, shareReplay, tap } from 'rxjs/operators';

import { NavNode } from '../models';
import { HospitalService, CommonService } from '../../../../services';

/**
 * Session-lifetime cache for the API data every ThreeMapBase view needs on
 * startup (block/floor list, map config, user preferences, per-floor layout
 * and nav nodes, MQTT broker). Root-provided so the data survives component
 * destruction: reopening a map view with the same parameters skips all of
 * these network calls.
 *
 * All keys are namespaced with the current facilityId so a facility switch
 * within the same session can never serve another facility's data.
 */
@Injectable({ providedIn: 'root' })
export class ThreeMapCacheService {

  private cache: Record<string, any> = {};
  private inFlightObs: Record<string, Observable<any>> = {};
  private inFlightPromises: Record<string, Promise<any>> = {};

  constructor(
    private readonly hospitalService: HospitalService,
    private readonly commonService: CommonService
  ) {}

  private facilityKey(key: string): string {
    const facilityId = localStorage.getItem(btoa('facilityId')) ?? '';
    return `${facilityId}:${key}`;
  }

  private getOrFetch(key: string, fetch: () => Observable<any>): Observable<any> {
    const k = this.facilityKey(key);
    if (this.cache.hasOwnProperty(k)) return of(this.cache[k]);
    if (!this.inFlightObs[k]) {
      this.inFlightObs[k] = fetch().pipe(
        tap(res => {
          if (res !== undefined && res !== null) this.cache[k] = res;
        }),
        finalize(() => { delete this.inFlightObs[k]; }),
        shareReplay(1)
      );
    }
    return this.inFlightObs[k];
  }

  private getOrFetchPromise<T>(key: string, factory: () => Promise<T>, cacheValue: (v: T) => boolean): Promise<T> {
    const k = this.facilityKey(key);
    if (this.cache.hasOwnProperty(k)) return Promise.resolve(this.cache[k]);
    if (!this.inFlightPromises[k]) {
      this.inFlightPromises[k] = factory()
        .then(value => {
          if (cacheValue(value)) this.cache[k] = value;
          return value;
        })
        .finally(() => { delete this.inFlightPromises[k]; });
    }
    return this.inFlightPromises[k];
  }

  // ── Startup API responses (full responses, cached as-is) ─────────

  getBlockWithFloors(): Observable<any> {
    return this.getOrFetch('blockWithFloors', () => this.hospitalService.getBlockWithFloors());
  }

  getMapConfig(): Observable<any> {
    return this.getOrFetch('mapConfig', () => this.commonService.getConfigFile('map-config'));
  }

  getPreference(userId: any, roleId: any): Observable<any> | undefined {
    if (userId == null || roleId == null) return undefined;
    return this.getOrFetch(`preference:${userId}|${roleId}`, () =>
      this.commonService.getPreference(userId, roleId)
    );
  }

  getMqttBroker(): Observable<any> {
    return this.getOrFetch('mqttBroker', () => this.commonService.getmqttBroker());
  }

  // ── Per-floor data (produced by the caller, deduped + cached here) ──

  /**
   * Caches the post-processed floor layout (after regional names are applied)
   * so repeat opens skip both the fetch and the name processing.
   * A null layout (fetch error) is NOT cached, so the next open retries.
   */
  getOrFetchFloorDetails(floorId: number, factory: () => Promise<any>): Promise<any> {
    return this.getOrFetchPromise(`floorDetails:${floorId}`, factory, layout => layout != null);
  }

  getOrFetchFloorNodes(floorId: number, factory: () => Promise<NavNode[]>): Promise<NavNode[]> {
    return this.getOrFetchPromise(`floorNodes:${floorId}`, factory, nodes => Array.isArray(nodes));
  }

  // ── Invalidation ──────────────────────────────────────────────────

  /**
   * Drops all cached user-preference responses. Must be called whenever the
   * map viewer state preference is saved, so the next map open reloads it.
   */
  clearPreferences(): void {
    const facilityId = localStorage.getItem(btoa('facilityId')) ?? '';
    const prefix = `${facilityId}:preference:`;
    Object.keys(this.cache).forEach(k => {
      if (k.startsWith(prefix)) delete this.cache[k];
    });
  }

  /** Clears the cached layout + nodes for one floor (current facility). */
  clearFloor(floorId: number): void {
    delete this.cache[this.facilityKey(`floorDetails:${floorId}`)];
    delete this.cache[this.facilityKey(`floorNodes:${floorId}`)];
  }

  clearAll(): void {
    this.cache = {};
    this.inFlightObs = {};
    this.inFlightPromises = {};
  }
}
