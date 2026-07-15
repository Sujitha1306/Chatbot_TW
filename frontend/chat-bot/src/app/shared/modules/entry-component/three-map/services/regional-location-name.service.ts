import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../../../../environments/environment';
import { LocationData } from '../models';

interface RegionalLocationName {
    name: string;
    translated: string;
}

@Injectable({ providedIn: 'root' })
export class RegionalLocationNameService {
    private floorNameMapPromises: Record<string, Promise<Map<number, RegionalLocationName>>> = {};

    constructor(private readonly http: HttpClient) {}

    applyToFloor(floorId: number, floorLayout: LocationData | null | undefined): Promise<void> {
        if (!floorId || !floorLayout || this.isEnglishLocale()) return Promise.resolve();

        return this.getFloorNameMap(floorId).then(locationMap => {
            this.applyToLocationTree(floorLayout, locationMap);
        }).catch(err => {
            console.warn('[ThreeMap] Failed to fetch regional location names', err);
        });
    }

    getDisplayName(location: LocationData | null | undefined): string {
        if (!location) return '';
        return location.displayName ?? (location.regionalName ? `${location.name} / ${location.regionalName}` : location.name);
    }

    private getFloorNameMap(floorId: number): Promise<Map<number, RegionalLocationName>> {
        const locale = this.getCurrentLocale();
        const cacheKey = `${floorId}:${locale}`;
        if (this.floorNameMapPromises[cacheKey]) return this.floorNameMapPromises[cacheKey];

        const url = `${environment.api_base_url_new}api/location/floor?floorIds=${encodeURIComponent(String(floorId))}&pageStart=0&pageSize=1`;
        this.floorNameMapPromises[cacheKey] = new Promise<Map<number, RegionalLocationName>>(resolve => {
            this.http.get(url).subscribe({
                next: res => {
                    const locationMap = new Map<number, RegionalLocationName>();
                    this.collectApiLocations(this.unwrapLocationResponse(res), locationMap);
                    resolve(locationMap);
                },
                error: () => resolve(new Map<number, RegionalLocationName>())
            });
        });

        return this.floorNameMapPromises[cacheKey];
    }

    private applyToLocationTree(location: LocationData, locationMap: Map<number, RegionalLocationName>): void {
        const apiLocation = locationMap.get(location.id);
        const englishName = this.firstNonEmptyString(apiLocation?.name, location.name);
        const regionalName = this.firstNonEmptyString(apiLocation?.translated);

        if (regionalName && !this.sameName(englishName, regionalName)) {
            location.displayName = `${englishName} / ${regionalName}`;
            location.mapLabel = `${englishName}\n${regionalName}`;
            location.regionalName = regionalName;
        }

        (location.children ?? []).forEach(child => this.applyToLocationTree(child, locationMap));
    }

    private unwrapLocationResponse(res: any): any {
        const root = res?.results ?? res;
        return root?.data ?? root?.content ?? root?.items ?? root?.locations ?? root;
    }

    private collectApiLocations(value: any, locationMap: Map<number, RegionalLocationName>): void {
        if (!value) return;
        if (Array.isArray(value)) {
            value.forEach(item => this.collectApiLocations(item, locationMap));
            return;
        }
        if (typeof value !== 'object') return;

        const id = Number(value.id ?? value.locationId ?? value.location_id);
        if (Number.isFinite(id)) {
            locationMap.set(id, {
                name: this.firstNonEmptyString(value.name),
                translated: this.firstNonEmptyString(value.translated)
            });
        }

        const childKeys = ['children', 'locations', 'locationList', 'locationDetails', 'floors', 'floorLocations'];
        childKeys.forEach(key => this.collectApiLocations(value[key], locationMap));
    }

    private getCurrentLocale(): string {
        return (localStorage.getItem(btoa('locale')) ?? localStorage.getItem(btoa('lang')) ?? '').toLowerCase();
    }

    private isEnglishLocale(): boolean {
        const locale = this.getCurrentLocale();
        return !locale || locale.startsWith('en');
    }

    private firstNonEmptyString(...values: any[]): string {
        for (const value of values) {
            if (typeof value === 'string' && value.trim()) return value.trim();
        }
        return '';
    }

    private sameName(a: string, b: string): boolean {
        return a.trim().toLowerCase() === b.trim().toLowerCase();
    }
}
