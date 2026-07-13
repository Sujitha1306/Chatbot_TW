import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UrlBuilderService {

  buildQueryParams(paramsObj: { [key: string]: any }): string {
    const params: any = {};

    for (const key in paramsObj) {
      if (
        paramsObj.hasOwnProperty(key) &&
        paramsObj[key] !== undefined &&
        paramsObj[key] !== null &&
        paramsObj[key] !== '' &&
        !(Array.isArray(paramsObj[key]) && paramsObj[key].length === 0)
      ) {
        params[key] = Array.isArray(paramsObj[key]) ? paramsObj[key].join(',') : paramsObj[key];
      }
    }

    return new URLSearchParams(params).toString().replace(/%2C/gi, ',');
  }

  buildUrl(baseUrl: string, paramsObj: { [key: string]: any }): string {
    const queryString = this.buildQueryParams(paramsObj);
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }
}