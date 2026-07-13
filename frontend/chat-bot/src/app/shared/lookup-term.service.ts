import { Injectable } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs';
import { map, tap, shareReplay, finalize } from 'rxjs/operators';
import { CommonService } from './services';

@Injectable({
  providedIn: 'root'
})
export class LookupTermService {

  public apptermDetails: { [group: string]: any[] } = {};
  public apptermLinkDetails: {[type: string]: { [group: string]: any[] }} = {};
  public apptermVersion2Details: { [group: string]: any[] } = {};

  private inFlightAppTerms: { [group: string]: Observable<any> } = {};
  private inFlightAppTermLinks: { [key: string]: Observable<any> } = {};
  private inFlightAppTermsVersion2: { [group: string]: Observable<any> } = {};

  private storeCache: boolean = false;

  constructor(private readonly commonService: CommonService) {
    this.getConfigkey();
  }

  // AppTerms Wrapper
  getAppTermsWrapper(groups: string | string[]): Observable<any> {

    const groupList = this.normalizeGroups(groups);
    let missingGroups: string[] = [];

    if (!this.storeCache) {
      missingGroups = groupList.filter( 
        group => delete this.apptermDetails[group] 
      );
    }

    missingGroups = groupList.filter(
      group => !this.apptermDetails[group]
    );

    if (missingGroups.length === 0) {
      return of(this.buildResult(groupList, this.apptermDetails));
    }

    const requests = missingGroups.map(group => {

      if (!this.inFlightAppTerms[group]) {

        this.inFlightAppTerms[group] = this.commonService
          .getAppTerms(group)
          .pipe(
            tap(res => this.storeAppTerms(res)),
            finalize(() => delete this.inFlightAppTerms[group]),
            shareReplay(1)
          );
      }

      return this.inFlightAppTerms[group];
    });

    return forkJoin(requests).pipe(
      map(() => this.buildResult(groupList, this.apptermDetails))
    );
  }

  // AppTermsLink Wrapper
  getAppTermsLinkWrapper(type: string, groupName?: string): Observable<any> {

    if (!this.apptermLinkDetails[type]) {
      this.apptermLinkDetails[type] = {};
    }

    const typeCache = this.apptermLinkDetails[type];

    if (!this.storeCache && groupName) {
      delete typeCache[groupName];
      const key = `${type}_${groupName}`;
      delete this.inFlightAppTermLinks[key];
    }

    if (groupName) {

      if (typeCache[groupName]) {
        return of({ [groupName]: typeCache[groupName] });
      }

      const key = `${type}_${groupName}`;

      if (!this.inFlightAppTermLinks[key]) {

        this.inFlightAppTermLinks[key] = this.commonService
          .getAppTermsLink(type, groupName)
          .pipe(
            tap(res => this.storeAppTermLinks(type, res)),
            finalize(() => delete this.inFlightAppTermLinks[key]),
            shareReplay(1)
          );
      }

      return this.inFlightAppTermLinks[key].pipe(
        map(() => ({
          [groupName]: this.apptermLinkDetails[type][groupName] || []
        }))
      );
    }

    if (!this.storeCache && !groupName) {
      delete this.apptermLinkDetails[type];
      const key = `${type}_ALL`;
      delete this.inFlightAppTermLinks[key];
    }

    if (!this.apptermLinkDetails[type]) {
      this.apptermLinkDetails[type] = {};
    }

    const updatedCache = this.apptermLinkDetails[type];

    if (Object.keys(updatedCache).length > 0) {
      return of(updatedCache);
    }

    const key = `${type}_ALL`;

    if (!this.inFlightAppTermLinks[key]) {

      this.inFlightAppTermLinks[key] = this.commonService
        .getAppTermsLink(type)
        .pipe(
          tap(res => this.storeAppTermLinks(type, res)),
          finalize(() => delete this.inFlightAppTermLinks[key]),
          shareReplay(1)
        );
    }

    return this.inFlightAppTermLinks[key].pipe(
      map(() => this.apptermLinkDetails[type] || {})
    );
  }

  // AppTermsVersion2 Wrapper
  getAppTermsVerion2Wrapper(groups: string | string[]): Observable<any> {

    const groupList = this.normalizeGroups(groups);

    if (!this.storeCache) {
      groupList.forEach(group => {
        delete this.apptermVersion2Details[group];
      });
    }

    const missingGroups = groupList.filter(
      group => !this.apptermVersion2Details[group]
    );

    if (missingGroups.length === 0) {
      return of(this.buildResult(groupList, this.apptermVersion2Details));
    }

    const requests = missingGroups.map(group => {

      if (!this.inFlightAppTermsVersion2[group]) {

        this.inFlightAppTermsVersion2[group] = this.commonService
          .getAppTermsVerion2(group)
          .pipe(
            tap(res => this.storeAppTermsVersion2(res)),
            finalize(() => delete this.inFlightAppTermsVersion2[group]),
            shareReplay(1)
          );
      }

      return this.inFlightAppTermsVersion2[group];
    });

    return forkJoin(requests).pipe(
      map(() => this.buildResult(groupList, this.apptermVersion2Details))
    );
  }

  // HELPERS

  private normalizeGroups(groups: string | string[]): string[] {
    return Array.isArray(groups)
      ? groups
      : groups.split(',').map(g => g.trim());
  }

  private buildResult(groupList: string[], source: any): any {
    const result: any = {};
    groupList.forEach(group => {
      result[group] = source[group] || [];
    });
    return result;
  }

  // STORE METHODS

  private storeAppTerms(res: any): void {
    if (!res?.results) return;

    res.results.forEach((item: any) => {
      const group = item.groupName;

      if (!this.apptermDetails[group]) {
        this.apptermDetails[group] = [];
      }

      if (!this.apptermDetails[group].some(x => x.code === item.code)) {
        this.apptermDetails[group].push(item);
      }
    });
  }

  private storeAppTermLinks(type: string, res: any): void {
    if (!res?.results) return;

    if (!this.apptermLinkDetails[type]) {
      this.apptermLinkDetails[type] = {};
    }

    res.results.forEach((item: any) => {
      const group = item.groupName;

      if (!this.apptermLinkDetails[type][group]) {
        this.apptermLinkDetails[type][group] = [];
      }

      if (!this.apptermLinkDetails[type][group].some(x => x.code === item.code)) {
        this.apptermLinkDetails[type][group].push(item);
      }
    });
  }

  private storeAppTermsVersion2(res: any): void {
    if (!res?.results) return;

    res.results.forEach((item: any) => {
      const group = item.groupName;

      if (!this.apptermVersion2Details[group]) {
        this.apptermVersion2Details[group] = [];
      }

      if (!this.apptermVersion2Details[group].some(x => x.code === item.code)) {
        this.apptermVersion2Details[group].push(item);
      }
    });
  }

  // CLEAR CACHE
  clearCache(param1?: string, param2?: string): void {

    const normalize = (val: string) => val?.trim();

    const getActualKey = (obj: any, key: string): string | null => {
      if (!obj || !key) return null;
      const lowerKey = key.toLowerCase();
      return Object.keys(obj).find(k => k.toLowerCase() === lowerKey) || null;
    };

    const value1 = param1 ? normalize(param1) : null;
    const value2 = param2 ? normalize(param2) : null;

    if (value1) {

      // CASE 1A
      if (value2) {

        const typeKey = getActualKey(this.apptermLinkDetails, value1);
        const groupKey = typeKey
          ? getActualKey(this.apptermLinkDetails[typeKey], value2)
          : null;

        if (typeKey && groupKey) {
          delete this.apptermLinkDetails[typeKey][groupKey];
        }

        delete this.inFlightAppTermLinks[`${value1}_${value2}`];
        return;
      }

      // CASE 1B
      const typeKey = getActualKey(this.apptermLinkDetails, value1);

      if (typeKey) {

        delete this.apptermLinkDetails[typeKey];

        Object.keys(this.inFlightAppTermLinks).forEach(key => {
          if (key.toLowerCase().startsWith(typeKey.toLowerCase() + '_')) {
            delete this.inFlightAppTermLinks[key];
          }
        });

        return;
      }

      // CASE 1C
      const groups = value1.split(',').map(g => normalize(g));

      groups.forEach(group => {

      // AppTerms
      const appKey = getActualKey(this.apptermDetails, group);
      if (appKey) {
        delete this.apptermDetails[appKey];
        delete this.inFlightAppTerms[appKey];
      }

      // Version2 (MISSING PART)
      const v2Key = getActualKey(this.apptermVersion2Details, group);
      if (v2Key) {
        delete this.apptermVersion2Details[v2Key];
        delete this.inFlightAppTermsVersion2[v2Key];
      }

    });

      return;
    }

    // CASE 2
    this.apptermDetails = {};
    this.apptermLinkDetails = {};
    this.apptermVersion2Details = {};

    this.inFlightAppTerms = {};
    this.inFlightAppTermLinks = {};
    this.inFlightAppTermsVersion2 = {};
  }

  private getConfigkey() {
    this.commonService.getConfigFile('facility-config').subscribe((res) => {
      this.storeCache = res?.results?.contentObject?.storeCache ?? false;
    });
  }
}