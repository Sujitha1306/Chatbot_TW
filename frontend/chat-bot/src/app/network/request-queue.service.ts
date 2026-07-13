import { Injectable } from '@angular/core';
import { HttpClient, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RequestQueueService {

 private failedRequests: (() => Observable<any>)[] = [];

  add(fn: () => Observable<any>): void {
    this.failedRequests.push(fn);
  }

  retryAll(): Observable<any>[] {
    const requests = [...this.failedRequests];
    return requests.map(fn => fn());    
  }
  
  clear(): void {
    this.failedRequests = [];
  }

  hasRequests(): boolean {
    return this.failedRequests.length > 0;
  }
}
